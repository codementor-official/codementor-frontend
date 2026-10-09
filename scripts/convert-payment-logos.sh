#!/usr/bin/env sh
# Đổi logo ví (MoMo, VNPAY) sang WebP cho màn rút tiền của Lecturer.
#
#   scripts/convert-payment-logos.sh <momo-logo> <vnpay-logo>
#
# Cắt viền trắng thừa (logo VNPAY nằm giữa một nền trắng rộng), thu về 192px — đủ nét cho ô
# 36–48px trên màn 3x — rồi xuất WebP vào apps/lecturer/public/payments/. Cần ImageMagick 7
# (`magick`). Chạy lại khi đối tác đổi logo; file nguồn không nằm trong repo.
set -eu

if [ "$#" -ne 2 ]; then
  echo "Cách dùng: $0 <momo-logo> <vnpay-logo>" >&2
  exit 1
fi
command -v magick >/dev/null 2>&1 || { echo "Thiếu ImageMagick (magick)" >&2; exit 1; }

out="$(dirname "$0")/../apps/lecturer/public/payments"
mkdir -p "$out"

convert_logo() {
  # -fuzz 4%: nền "trắng" của ảnh JPEG không trắng tuyệt đối sau khi nén.
  magick "$1" -fuzz 4% -trim +repage -resize 192x192 -strip -quality 90 "$out/$2.webp"
  echo "$out/$2.webp: $(magick identify -format '%wx%h, %b' "$out/$2.webp")"
}

convert_logo "$1" momo
convert_logo "$2" vnpay
