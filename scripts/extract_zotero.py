#!/usr/bin/env python3
"""
extract_zotero.py — 从本地 Zotero SQLite 数据库提取完整文献数据

提取内容:
  1. 所有 collection（文献库分类，支持嵌套）
  2. 所有论文条目（journalArticle, conferencePaper, bookSection, report 等）
  3. 论文的作者、标签、DOI、摘要等元数据
  4. 笔记（note 类型条目，关联到父论文）
  5. PDF 附件信息

输出: JSON 文件，格式适配 Academic Hub KV 存储
"""

import sqlite3
import json
import os
import re
import sys
from datetime import datetime
from typing import Dict, List, Any

# ============================
# 配置
# ============================
ZOTERO_DB = r"C:\Users\Lenovo\Zotero\zotero.sqlite"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "zotero_export.json")


# ============================
# SQLite 数据库操作
# ============================

def connect_db(path: str) -> sqlite3.Connection:
    """连接 Zotero SQLite 数据库（只读模式）"""
    if not os.path.exists(path):
        print(f"[ERROR] Zotero 数据库未找到: {path}", file=sys.stderr)
        sys.exit(1)
    uri = path.replace("\\", "/")
    conn = sqlite3.connect(f"file:{uri}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def get_item_type_map(conn):
    rows = conn.execute("SELECT itemTypeID, typeName FROM itemTypesCombined").fetchall()
    return {row[0]: row[1] for row in rows}


def get_field_map(conn):
    rows = conn.execute("SELECT fieldID, fieldName FROM fieldsCombined").fetchall()
    return {row[0]: row[1] for row in rows}


def get_creator_type_map(conn):
    rows = conn.execute("SELECT creatorTypeID, creatorType FROM creatorTypes").fetchall()
    return {row[0]: row[1] for row in rows}


def get_tag_map(conn):
    rows = conn.execute("SELECT tagID, name FROM tags").fetchall()
    return {row[0]: row[1] for row in rows}


# ============================
# 数据提取
# ============================

def extract_collections(conn):
    rows = conn.execute("""
        SELECT collectionID, libraryID, key, collectionName, parentCollectionID
        FROM collections
        ORDER BY libraryID, parentCollectionID, collectionName
    """).fetchall()
    return [{
        "collectionId": r["collectionID"],
        "libraryId": r["libraryID"],
        "key": r["key"],
        "name": r["collectionName"] or "未命名分类",
        "parentCollectionId": r["parentCollectionID"],
    } for r in rows]


def extract_collection_items(conn):
    rows = conn.execute("SELECT collectionID, itemID FROM collectionItems").fetchall()
    mapping = {}
    for r in rows:
        cid, iid = r["collectionID"], r["itemID"]
        mapping.setdefault(cid, []).append(iid)
    return mapping


def extract_items_metadata(conn, item_type_map, field_map):
    items = conn.execute("""
        SELECT itemID, itemTypeID, key, dateAdded, dateModified, libraryID
        FROM items
        ORDER BY itemID
    """).fetchall()

    data_rows = conn.execute("""
        SELECT id.itemID, id.fieldID, idv.value
        FROM itemData id
        JOIN itemDataValues idv ON id.valueID = idv.valueID
    """).fetchall()

    item_fields = {}
    for r in data_rows:
        iid = r["itemID"]
        fname = field_map.get(r["fieldID"], f"field_{r['fieldID']}")
        item_fields.setdefault(iid, {})[fname] = r["value"]

    result = {}
    for item in items:
        iid = item["itemID"]
        result[iid] = {
            "itemId": iid,
            "typeName": item_type_map.get(item["itemTypeID"], "unknown"),
            "key": item["key"],
            "dateAdded": item["dateAdded"],
            "dateModified": item["dateModified"],
            "libraryId": item["libraryID"],
            "fields": item_fields.get(iid, {}),
        }
    return result


def extract_creators(conn, creator_type_map):
    rows = conn.execute("""
        SELECT ic.itemID, c.firstName, c.lastName, c.fieldMode,
               ic.creatorTypeID, ic.orderIndex
        FROM itemCreators ic
        JOIN creators c ON ic.creatorID = c.creatorID
        ORDER BY ic.itemID, ic.orderIndex
    """).fetchall()

    result = {}
    for r in rows:
        iid = r["itemID"]
        ct_name = creator_type_map.get(r["creatorTypeID"], "unknown")
        fn = r["firstName"] or ""
        ln = r["lastName"] or ""
        if r["fieldMode"] == 1:
            name = ln
        else:
            name = f"{fn} {ln}".strip()
        result.setdefault(iid, []).append({
            "name": name,
            "firstName": fn,
            "lastName": ln,
            "creatorType": ct_name,
            "orderIndex": r["orderIndex"],
        })
    return result


def extract_tags(conn, tag_map):
    rows = conn.execute("SELECT itemID, tagID FROM itemTags WHERE type = 0").fetchall()
    result = {}
    for r in rows:
        tag_name = tag_map.get(r["tagID"], "")
        if tag_name:
            result.setdefault(r["itemID"], []).append(tag_name)
    return result


def extract_notes(conn):
    rows = conn.execute("""
        SELECT inote.itemID, inote.parentItemID, inote.note, inote.title,
               i.key, i.dateAdded
        FROM itemNotes inote
        JOIN items i ON inote.itemID = i.itemID
        WHERE inote.parentItemID IS NOT NULL
    """).fetchall()

    result = {}
    for r in rows:
        pid = r["parentItemID"]
        result.setdefault(pid, []).append({
            "itemId": r["itemID"],
            "zoteroKey": r["key"],
            "title": r["title"] or "",
            "content": r["note"] or "",
            "dateAdded": r["dateAdded"],
        })
    return result


def extract_attachments(conn):
    rows = conn.execute("""
        SELECT ia.itemID, ia.parentItemID, ia.contentType, ia.path, ia.linkMode, i.key
        FROM itemAttachments ia
        JOIN items i ON ia.itemID = i.itemID
        WHERE ia.parentItemID IS NOT NULL
    """).fetchall()

    result = {}
    for r in rows:
        pid = r["parentItemID"]
        result.setdefault(pid, []).append({
            "itemId": r["itemID"],
            "zoteroKey": r["key"],
            "contentType": r["contentType"],
            "path": r["path"],
            "linkMode": r["linkMode"],
        })
    return result


def extract_item_type_stats(conn):
    """统计每种 item 类型的数量"""
    rows = conn.execute("""
        SELECT it.typeName, COUNT(i.itemID) as cnt
        FROM items i
        JOIN itemTypesCombined it ON i.itemTypeID = it.itemTypeID
        GROUP BY it.typeName
        ORDER BY cnt DESC
    """).fetchall()
    return [(r["typeName"], r["cnt"]) for r in rows]


# ============================
# 数据转换
# ============================

PAPER_TYPES = {
    "journalArticle", "conferencePaper", "bookSection",
    "report", "thesis", "book", "preprint", "manuscript",
    "webpage", "blogPost", "magazineArticle", "newspaperArticle",
    "presentation", "computerProgram",
}
SKIP_TYPES = {"note", "attachment", "annotation"}


def _map_venue_type(type_name):
    t = type_name.lower()
    if "journal" in t or "magazine" in t or "newspaper" in t:
        return "journal"
    elif "conference" in t or "proceedings" in t or "presentation" in t:
        return "conference"
    elif "preprint" in t:
        return "preprint"
    return "journal"


def build_export_data(
    items_meta, creators_map, tags_map,
    notes_map, attachments_map,
    collections, collection_items_map,
):
    papers = []
    notes_export = []
    libraries = []
    collection_id_to_key = {c["collectionId"]: c["key"] for c in collections}
    collection_id_to_name = {c["collectionId"]: c["name"] for c in collections}
    paper_index_map = {}

    for item_id, meta in items_meta.items():
        type_name = meta["typeName"]
        if type_name in SKIP_TYPES:
            continue

        fields = meta["fields"]
        title = fields.get("title", "未命名文献")
        date_str = fields.get("date", "")

        year = None
        if date_str:
            m = re.search(r"(\d{4})", str(date_str))
            if m:
                year = int(m.group(1))

        authors = []
        if item_id in creators_map:
            for c in sorted(creators_map[item_id], key=lambda x: x["orderIndex"]):
                if c["creatorType"] == "author":
                    authors.append(c["name"])

        paper = {
            "zoteroKey": meta["key"],
            "zoteroItemId": item_id,
            "title": title,
            "authors": authors,
            "year": year or datetime.now().year,
            "venue": fields.get("publicationTitle", fields.get("publisher", "")),
            "venueType": _map_venue_type(type_name),
            "abstract": fields.get("abstractNote", ""),
            "doi": fields.get("DOI", ""),
            "url": fields.get("url", ""),
            "volume": str(fields.get("volume", "")),
            "issue": str(fields.get("issue", "")),
            "pages": str(fields.get("pages", "")),
            "tags": tags_map.get(item_id, []),
            "typeName": type_name,
            "dateAdded": meta["dateAdded"],
            "dateModified": meta["dateModified"],
            "notes": notes_map.get(item_id, []),
            "attachments": attachments_map.get(item_id, []),
        }

        paper_index_map[item_id] = len(papers)
        papers.append(paper)

    # 构建 library 列表
    for col in collections:
        lib = {
            "zoteroKey": col["key"],
            "name": col["name"],
            "parentKey": None,
            "paperKeys": [],
        }
        if col["parentCollectionId"]:
            parent_key = collection_id_to_key.get(col["parentCollectionId"])
            if parent_key:
                lib["parentKey"] = parent_key

        if col["collectionId"] in collection_items_map:
            for item_id in collection_items_map[col["collectionId"]]:
                if item_id in paper_index_map:
                    lib["paperKeys"].append(papers[paper_index_map[item_id]]["zoteroKey"])

        libraries.append(lib)

    # 笔记总览
    for paper in papers:
        for note in paper.get("notes", []):
            notes_export.append({
                "paperZoteroKey": paper["zoteroKey"],
                "content": note.get("content", ""),
                "dateAdded": note.get("dateAdded", ""),
                "title": note.get("title", ""),
            })

    total_papers = len([p for p in papers if p["typeName"] not in {"note", "attachment"}])
    return {
        "exportInfo": {
            "exportedAt": datetime.now().isoformat(),
            "source": "Zotero SQLite",
            "totalPapers": total_papers,
            "totalNotes": len(notes_export),
            "totalLibraries": len(libraries),
            "totalAttachments": sum(len(p.get("attachments", [])) for p in papers),
        },
        "papers": papers,
        "notes": notes_export,
        "libraries": libraries,
    }


# ============================
# 主流程
# ============================

def main():
    print("=" * 60)
    print("  Zotero 数据提取工具 - Academic Hub KV 导入")
    print("=" * 60)
    print(f"\n[INFO] 数据库路径: {ZOTERO_DB}")

    conn = connect_db(ZOTERO_DB)
    print("[INFO] 数据库连接成功 (只读模式)")

    # 0. 统计概览
    print("\n[STEP 0] 库内条目类型统计...")
    type_stats = extract_item_type_stats(conn)
    for tn, cnt in type_stats:
        print(f"  {tn}: {cnt}")

    # 1. 映射表
    print("\n[STEP 1] 加载映射表...")
    item_type_map = get_item_type_map(conn)
    field_map = get_field_map(conn)
    creator_type_map = get_creator_type_map(conn)
    tag_map = get_tag_map(conn)
    print(f"  itemTypes: {len(item_type_map)}, fields: {len(field_map)}, "
          f"creatorTypes: {len(creator_type_map)}, tags: {len(tag_map)}")

    # 2-8. 提取各类数据
    print("\n[STEP 2] 提取文献库分类...")
    collections = extract_collections(conn)
    print(f"  共 {len(collections)} 个分类")
    for c in collections[:20]:
        indent = "    " if c["parentCollectionId"] else "  "
        is_parent = not c["parentCollectionId"]
        prefix = "[+]" if is_parent else "  L--"
        print(f"  {indent}{prefix} {c['name']}")
    if len(collections) > 20:
        print(f"  ... 还有 {len(collections) - 20} 个")

    print("\n[STEP 3] 提取分类-条目映射...")
    collection_items_map = extract_collection_items(conn)
    print(f"  共 {len(collection_items_map)} 个分类有条目")

    print("\n[STEP 4] 提取条目元数据...")
    items_meta = extract_items_metadata(conn, item_type_map, field_map)
    print(f"  共 {len(items_meta)} 个条目")

    print("\n[STEP 5] 提取作者信息...")
    creators_map = extract_creators(conn, creator_type_map)
    print(f"  {len(creators_map)} 个条目有作者")

    print("\n[STEP 6] 提取标签...")
    tags_map = extract_tags(conn, tag_map)
    print(f"  {len(tags_map)} 个条目有标签")

    print("\n[STEP 7] 提取笔记...")
    notes_map = extract_notes(conn)
    print(f"  {len(notes_map)} 个父条目有笔记")

    print("\n[STEP 8] 提取附件...")
    attachments_map = extract_attachments(conn)
    total_att = sum(len(v) for v in attachments_map.values())
    print(f"  共 {total_att} 个附件, 分布在 {len(attachments_map)} 个父条目")

    # 9. 构建导出数据
    print("\n[STEP 9] 构建 Academic Hub 格式数据...")
    export_data = build_export_data(
        items_meta, creators_map, tags_map,
        notes_map, attachments_map,
        collections, collection_items_map,
    )

    # 10. 写入 JSON
    print(f"\n[STEP 10] 写入 JSON...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)

    file_size = os.path.getsize(OUTPUT_FILE)
    print(f"  路径: {OUTPUT_FILE}")
    print(f"  大小: {file_size:,} 字节 ({file_size / 1024:.1f} KB)")

    # 11. 摘要
    info = export_data["exportInfo"]
    print("\n" + "=" * 60)
    print("  [OK] 导出完成!")
    print("=" * 60)
    print(f"  论文: {info['totalPapers']}")
    print(f"  笔记: {info['totalNotes']}")
    print(f"  分类: {info['totalLibraries']}")
    print(f"  附件: {info['totalAttachments']}")
    print(f"  输出: {OUTPUT_FILE}")

    conn.close()
    return export_data


if __name__ == "__main__":
    main()
