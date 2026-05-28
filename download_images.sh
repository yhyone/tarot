#!/bin/bash
# Download all 78 Rider-Waite tarot card images (Public Domain)
# Source: metabismuth/tarot-json GitHub repo
# Total size: ~7.5 MB

BASE_URL="https://raw.githubusercontent.com/metabismuth/tarot-json/master/cards"
CARDS_DIR="$(cd "$(dirname "$0")" && pwd)/cards"

echo "============================================"
echo "  塔罗牌图片下载脚本"
echo "  图片数量: 78 张 | 总大小约 7.5 MB"
echo "  图片来源: Public Domain (Rider-Waite 1909)"
echo "============================================"
echo ""

mkdir -p "$CARDS_DIR"

# Card list: prefix + range
# Major Arcana: m00-m21 (22 cards)
# Cups (圣杯):  c01-c14 (14 cards)
# Swords (宝剑): s01-s14 (14 cards)
# Wands (权杖):  w01-w14 (14 cards)
# Pentacles (星币): p01-p14 (14 cards)

download_card() {
    prefix=$1
    num=$2
    filename="${prefix}$(printf '%02d' $num).jpg"
    url="$BASE_URL/$filename"

    if [ -f "$CARDS_DIR/$filename" ]; then
        echo "  跳过已存在: $filename"
        return
    fi

    printf "  下载: %-20s" "$filename"
    if curl -sL --connect-timeout 10 --max-time 30 -o "$CARDS_DIR/$filename" "$url"; then
        size=$(ls -lh "$CARDS_DIR/$filename" | awk '{print $5}')
        echo " ✓ ($size)"
    else
        echo " ✗ 失败，将重试..."
        sleep 1
        if curl -sL --connect-timeout 10 --max-time 30 -o "$CARDS_DIR/$filename" "$url"; then
            echo "  重试成功: $filename"
        else
            echo "  ✗ 下载失败: $filename"
        fi
    fi
}

echo "[1/5] 大阿尔卡纳 (Major Arcana) - 22张"
for i in $(seq 0 21); do
    download_card "m" $i
done

echo ""
echo "[2/5] 圣杯牌组 (Cups) - 14张"
for i in $(seq 1 14); do
    download_card "c" $i
done

echo ""
echo "[3/5] 宝剑牌组 (Swords) - 14张"
for i in $(seq 1 14); do
    download_card "s" $i
done

echo ""
echo "[4/5] 权杖牌组 (Wands) - 14张"
for i in $(seq 1 14); do
    download_card "w" $i
done

echo ""
echo "[5/5] 星币牌组 (Pentacles) - 14张"
for i in $(seq 1 14); do
    download_card "p" $i
done

echo ""
echo "============================================"
echo "  下载完成！"
echo "  图片位置: $CARDS_DIR"
echo "  已下载: $(ls "$CARDS_DIR"/*.jpg 2>/dev/null | wc -l) / 78 张"
echo "============================================"
