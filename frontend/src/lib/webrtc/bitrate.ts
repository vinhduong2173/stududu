/**
 * video-call-upgrade.md mục 3.2 — việc quan trọng nhất của cả đợt nâng cấp.
 *
 * `getMediaConstraints()` chỉ quy định ĐỘ PHÂN GIẢI và KHUNG HÌNH, *không* quy
 * định bitrate. Để mặc định, trình duyệt tự đẩy lên 800 kbps–1.5 Mbps tuỳ mạng
 * và hạn mức TURN 20 GB/tháng tụt nhanh gấp 2–3 lần dự kiến (mục 3.1).
 *
 * BR-34 — 640×480 @ 24fps, tối đa 500 kbps.
 */

/** Đổi ở ĐÂY, một chỗ duy nhất. Xem bảng ngân sách TURN ở mục 3.1 trước khi nâng. */
export const MAX_VIDEO_BITRATE = 500_000; // bps

/**
 * Phải gọi SAU khi kết nối xong (sau `setRemoteDescription`) vì lúc đó
 * `sender` mới tồn tại. Gọi sớm hơn thì hàm này im lặng không làm gì.
 */
export async function capVideoBitrate(
  pc: RTCPeerConnection,
  maxBitrate: number = MAX_VIDEO_BITRATE,
): Promise<void> {
  const sender = pc.getSenders().find((s) => s.track?.kind === "video");
  if (!sender) return;

  const params = sender.getParameters();
  // Một số trình duyệt trả encodings rỗng — phải khởi tạo trước khi gán.
  if (!params.encodings?.length) params.encodings = [{}];
  params.encodings[0].maxBitrate = maxBitrate;

  // setParameters ném lỗi nếu params đã cũ (đua với renegotiation). Giới hạn
  // bitrate hỏng không đáng để rớt cuộc gọi — quota tụt nhanh còn hơn mất hình.
  await sender.setParameters(params).catch(() => undefined);
}
