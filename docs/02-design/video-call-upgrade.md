# Nâng cấp Gọi thoại → Gọi video

**Người lập:** Vinh (BA) · **Ngày:** 26/07/2026 · **Cập nhật:** 28/07/2026 · **Trạng thái:** Đã implement — còn chờ đo bitrate thật và test mức 3 (mục 8)

**Đọc cùng:** [`audio-call-design.md`](audio-call-design.md) — tài liệu này chỉ ghi **phần khác biệt**, không lặp lại signaling, state machine, hay ràng buộc nghiệp vụ đã có.

---

## 1. Hiện trạng: bốn điểm chừa sẵn đã làm đúng

Kiểm tra code sau khi audio call chạy ổn — team đã implement đủ 4 điểm mở rộng ở `audio-call-design.md` mục 8:

| Điểm chừa sẵn | Trạng thái | Bằng chứng |
|---|---|---|
| ① Trường `kind` trong dữ liệu và payload | ✅ | `enum CallKind { audio video }` trong schema; `kind` trong `CallInvitePayload` |
| ② Gom media constraints một chỗ | ✅ | `constraints.ts` — `getMediaConstraints(kind)` **đã có sẵn nhánh video** `{width:640, height:480, frameRate:24}` |
| ③ UI chừa chỗ cho khung hình | ✅ | `CallScreen.tsx` — 2 thẻ `<video>` với `!isVideo && "hidden"` |
| ④ Tách logic WebRTC khỏi giao diện | ✅ | `lib/webrtc/` (logic) tách khỏi `components/call/` (hiển thị) |

Hơn thế nữa: `startCall(conversationId, partner, kind = "audio")` **đã nhận `kind` làm tham số**. Về lý thuyết, gọi `startCall(convId, partner, "video")` là đã có video — SDP tự mô tả luồng media, signaling không cần đổi một dòng nào.

> **Nghĩa là phần "đường ống" đã xong.** Việc còn lại là điều khiển, giao diện, và — quan trọng nhất — **kiểm soát băng thông**.

## 2. Việc còn phải làm

| # | Việc | Phía | Độ lớn | Trạng thái |
|---|---|---|---|---|
| 1 | **Giới hạn bitrate video** (mục 3) | FE | S — nhưng quan trọng nhất | ✅ `lib/webrtc/bitrate.ts` |
| 2 | Nút gọi video trong màn chat | FE | S | ✅ `inbox/page.tsx` |
| 3 | Bật/tắt camera giữa cuộc gọi (mục 4) | FE + BE | M | ✅ `usePeerConnection.toggleCamera` |
| 4 | Event `call:media-state` báo trạng thái camera cho phía kia | BE | S | ✅ `CallsService.relayMediaState` |
| 5 | Bố cục màn hình gọi video (mục 5) | FE | M | ✅ `CallScreen.tsx` |
| 6 | Lật gương khung hình của mình | FE | XS | ✅ `-scale-x-100` (chỉ camera trước) |
| 7 | Đổi camera trước/sau trên mobile | FE | S | ✅ `usePeerConnection.switchCamera` |
| 8 | Cập nhật business rules + tài liệu | BA | S | ✅ BR-33 → BR-37 trong `feature-design-v2.md` |
| 9 | Test (mục 8) | Cả nhóm | M | ⏳ đã có test BE cho `call:media-state`; checklist tay còn lại |

**Không cần làm lại:** signaling, state machine, `CallSession`, tính giờ chat, glare, timeout 30 phút, ICE config — dùng nguyên.

## 3. Ngân sách TURN — ràng buộc chính của video

Đây là thứ đổi hoàn toàn khi chuyển từ audio sang video, và là lý do phải đọc kỹ mục này trước khi code.

### 3.1. Con số

Với hạn mức **20 GB/tháng miễn phí** của Open Relay, cuộc gọi 30 phút:

| Cấu hình | 1 chiều | Qua TURN (2 chiều) | Cuộc/tháng nếu **mọi cuộc** qua TURN | Thực tế (~15% qua TURN) |
|---|---|---|---|---|
| Audio-only (đang chạy) | 9 MB | 18 MB | ~1.100 | ~7.400 |
| Video 320×240 ~250 kbps | 65 MB | 130 MB | ~150 | ~1.000 |
| Video 480×360 ~400 kbps | 99 MB | 198 MB | ~100 | ~670 |
| **Video 640×480 ~500 kbps** | 122 MB | 243 MB | **~80** | **~550** |
| Video 640×480 **không giới hạn** ~800 kbps | 189 MB | 378 MB | ~53 | ~350 |
| Video 720p ~1.500 kbps | 346 MB | 693 MB | ~29 | ~190 |

**Đọc bảng này thế nào:** cột áp chót là trường hợp xấu nhất (mọi cuộc đều phải trung chuyển). Thực tế chỉ khoảng 10–20% cuộc gọi cần TURN — phần còn lại nối thẳng máy-tới-máy và **không tốn quota**. Cột cuối là ước lượng thực tế.

**Kết luận: vẫn đủ dùng cho đồ án, với điều kiện giới hạn bitrate.** Để mặc định không giới hạn, trình duyệt sẽ tự đẩy lên 800 kbps–1.5 Mbps tuỳ mạng, và quota tụt nhanh gấp 2–3 lần.

### 3.2. Giới hạn bitrate — việc quan trọng nhất của cả đợt nâng cấp

Constraints trong `getMediaConstraints()` chỉ quy định **độ phân giải và khung hình**, *không* quy định bitrate. Phải đặt riêng qua `RTCRtpSender`:

```ts
// lib/webrtc/bitrate.ts
const MAX_VIDEO_BITRATE = 500_000; // bps — đổi ở đây, một chỗ duy nhất

export async function capVideoBitrate(pc: RTCPeerConnection, maxBitrate = MAX_VIDEO_BITRATE) {
  const sender = pc.getSenders().find((s) => s.track?.kind === "video");
  if (!sender) return;

  const params = sender.getParameters();
  // Một số trình duyệt trả encodings rỗng — phải khởi tạo trước khi gán
  if (!params.encodings?.length) params.encodings = [{}];
  params.encodings[0].maxBitrate = maxBitrate;
  await sender.setParameters(params);
}
```

**Gọi sau khi kết nối xong** (sau `setRemoteDescription`), vì lúc đó `sender` mới tồn tại.

> Đặt hằng số ở **một chỗ duy nhất** để sau này chỉnh theo tình hình quota mà không phải đi tìm khắp code.

### 3.3. Nếu quota vẫn lo

Ba lựa chọn, theo thứ tự nên cân nhắc:

1. **Hạ xuống 480×360 @ 400 kbps** — chất lượng vẫn ổn cho việc luyện nói (chỉ cần nhìn thấy khẩu hình và biểu cảm), tiết kiệm ~20%
2. Rút thời lượng tối đa video call xuống dưới 30 phút (audio vẫn giữ 30 phút)
3. Đăng ký thêm một tài khoản TURN dự phòng, cấu hình nhiều ICE server

**Đừng chọn:** tắt TURN để tiết kiệm. Không có TURN thì một phần người dùng đơn giản là không gọi được, và lỗi đó không tái hiện được trên máy dev.

## 4. Bật/tắt camera giữa cuộc gọi — không cần renegotiation

Đây là chỗ dễ làm phức tạp hoá nhất. Ghi rõ để tránh.

### 4.1. Cách làm đúng

Khi bắt đầu cuộc gọi video, lấy **cả hai luồng** (audio + video) ngay từ đầu. Tắt camera giữa chừng chỉ là:

```ts
const videoTrack = localStream.getVideoTracks()[0];
videoTrack.enabled = false;   // ngừng gửi hình, KHÔNG đụng tới kết nối
```

`enabled = false` khiến track gửi khung hình rỗng, băng thông tụt gần về 0, **và không cần thương lượng lại kết nối**. Bật lại chỉ là `enabled = true`.

Cùng cơ chế với nút tắt micro đang chạy — nên không có gì mới về mặt kỹ thuật.

### 4.2. Phải báo cho phía bên kia

Nếu không báo, người kia nhìn thấy **hình đen** và tưởng lỗi mạng. Thêm một event:

| Event | Hướng | Payload | Xử lý |
|---|---|---|---|
| `call:media-state` | Client → Server → Client | `{ callId, audio: boolean, video: boolean }` | Server chỉ chuyển tiếp, không lưu. Phía nhận hiện avatar + nhãn "Đã tắt camera" thay cho khung hình đen |

### 4.3. Việc CẦN renegotiation — đề xuất hoãn

**Nâng cấp một cuộc gọi audio đang diễn ra thành video** (thêm luồng video vào kết nối chưa có) mới là thứ cần thương lượng lại: `addTrack` → `onnegotiationneeded` → trao đổi offer/answer mới giữa cuộc gọi.

Đề xuất **chưa làm lần này**. Lý do: phức tạp hơn hẳn, dễ sinh lỗi trạng thái, trong khi giá trị thấp — người dùng có thể cúp máy rồi gọi lại bằng video. Nếu sau này cần, đây là hạng mục riêng.

**Do đó:** loại cuộc gọi (`kind`) chọn **lúc bắt đầu** và giữ nguyên đến hết cuộc.

## 5. Giao diện

| Hạng mục | Yêu cầu |
|---|---|
| Bố cục | Khung hình đối phương chiếm toàn màn; khung hình của mình nhỏ ở góc (đã có sẵn trong `CallScreen`) |
| **Lật gương khung hình của mình** | `transform: scaleX(-1)` — chỉ áp cho khung của mình, **không** áp cho khung đối phương. Không lật thì người dùng thấy chữ ngược, cảm giác rất lạ |
| Khi đối phương tắt camera | Hiện avatar + tên + nhãn "Đã tắt camera", **không** để hình đen |
| Khi mình tắt camera | Khung nhỏ hiện avatar của mình |
| Nút điều khiển | Tắt/bật micro · Tắt/bật camera · Đổi camera trước-sau (chỉ mobile) · Kết thúc |
| Mạng yếu | Hiện chỉ báo khi `connectionState` chuyển `disconnected` — người dùng cần biết là do mạng, không phải app hỏng |
| Nút gọi trong màn chat | Hai nút riêng: 📞 gọi thoại · 📹 gọi video |

**Đổi camera trước/sau (mobile):**

```ts
const newStream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: usingFront ? "environment" : "user" },
});
const sender = pc.getSenders().find((s) => s.track?.kind === "video");
await sender?.replaceTrack(newStream.getVideoTracks()[0]);  // không cần renegotiation
```

`replaceTrack` đổi nguồn hình mà không thương lượng lại — đúng công cụ cho việc này.

## 6. Ràng buộc nghiệp vụ bổ sung

Kế thừa toàn bộ BR-20 → BR-25 của audio call. Thêm:

| Mã | Quy tắc |
|---|---|
| BR-33 | Loại cuộc gọi (`audio`/`video`) chọn khi bắt đầu, **không đổi giữa cuộc** |
| BR-34 | Video giới hạn **640×480 @ 24fps, tối đa 500 kbps** — bảo vệ hạn mức TURN |
| BR-35 | Tắt camera dùng `track.enabled`, phải báo phía kia qua `call:media-state` |
| BR-36 | **Không ghi hình cuộc gọi** — mở rộng BR-22 (không ghi âm) |
| BR-37 | Người nhận cuộc gọi video được **trả lời ở chế độ audio**: chỉ xin micro, vẫn nhìn thấy đối phương, phía kia thấy avatar của mình |

**Đã rà số hiệu:** dự thảo ban đầu đánh BR-26 → BR-30, nhưng `feature-design-v2.md` đã dùng BR-26 → BR-32 cho Community và Trò chơi. Số chính thức là **BR-33 → BR-37**, đã ghi vào `feature-design-v2.md` mục 3.4.

## 7. Bẫy riêng của video

Ngoài 8 bẫy đã liệt kê ở `audio-call-design.md` mục 9:

| Bẫy | Hậu quả | Cách tránh |
|---|---|---|
| **Không giới hạn bitrate** | Quota TURN tụt gấp 2–3 lần dự kiến | Mục 3.2 — làm ngay từ đầu |
| **Không lật gương khung hình của mình** | Người dùng thấy chữ ngược, cảm giác sai | `scaleX(-1)` chỉ cho khung của mình |
| **Quên tắt camera khi kết thúc** | Đèn camera vẫn sáng — nghiêm trọng hơn micro nhiều về mặt riêng tư | `track.stop()` cho **mọi** track, kiểm tra kỹ đèn camera đã tắt |
| Hình đen khi đối phương tắt camera | Người dùng tưởng lỗi mạng | Event `call:media-state` (mục 4.2) |
| Điện thoại nóng, tụt pin nhanh | Encode video rất tốn tài nguyên | Giới hạn 640×480@24; cân nhắc hạ thêm cho mobile |
| Xoay ngang/dọc trên mobile | Khung hình méo hoặc lệch | Test cả hai chiều xoay |
| Xin quyền camera bị từ chối riêng | Người dùng cho micro nhưng chặn camera | Xử lý riêng: vẫn gọi được, chỉ không có hình — không huỷ cả cuộc gọi |

## 8. Test bổ sung

Ngoài kế hoạch test 4 mức ở tài liệu audio (**vẫn phải qua mức 3: 2 máy, 2 mạng khác nhau**):

- [ ] Gọi video, thấy hình và nghe tiếng cả hai chiều
- [ ] Tắt camera → phía kia hiện avatar, **không** phải hình đen
- [ ] Bật lại camera → hình hiện lại bình thường
- [ ] Tắt micro trong lúc video vẫn chạy
- [ ] Khung hình của mình hiển thị **lật gương**, khung đối phương thì không
- [ ] Đổi camera trước/sau trên điện thoại
- [ ] Xoay ngang/dọc trên điện thoại
- [ ] Cho micro nhưng **từ chối camera** → vẫn gọi được, chỉ mất hình
- [ ] Kết thúc cuộc gọi → **đèn camera tắt hẳn** (kiểm tra bằng mắt)
- [ ] **Đo bitrate thực tế** bằng `chrome://webrtc-internals` — xác nhận không vượt 500 kbps
- [ ] Mạng yếu (bật giới hạn tốc độ trong DevTools) → hình giảm chất lượng chứ không đứt kết nối
- [ ] Gọi video 30 phút → tự ngắt đúng như audio

**Cách đo bitrate:** mở `chrome://webrtc-internals` trong lúc gọi, xem biểu đồ `bytesSent`. Đây là cách duy nhất xác nhận `setParameters` có ăn hay không — thiếu bước này thì không biết quota đang bị đốt nhanh cỡ nào.

## 9. Thứ tự làm

| # | Việc | Người | Phụ thuộc |
|---|---|---|---|
| 1 | `capVideoBitrate()` + gọi sau khi kết nối | FE | — |
| 2 | Nút gọi video trong màn chat | FE | — |
| 3 | Event `call:media-state` | BE | — |
| 4 | Nút bật/tắt camera + hiện avatar khi tắt | FE | 3 |
| 5 | Lật gương + bố cục màn hình video | FE | 2 |
| 6 | Đổi camera trước/sau | FE | 5 |
| 7 | Đo bitrate qua `webrtc-internals`, chỉnh hằng số nếu cần | FE + BA | 1 |
| 8 | Test đủ mục 8 | Cả nhóm | 1–7 |

**Bước 1 → 6 đã xong** (28/07/2026). Còn lại bước 7 và 8 — đều là việc phải làm trên máy thật, không thay được bằng test tự động: `setParameters` có ăn hay không chỉ `chrome://webrtc-internals` mới trả lời được.

**Bước 1 làm trước bước 2** có chủ đích: bật nút gọi video trước khi giới hạn bitrate là mở đường cho quota bị đốt trong lúc test.

## 10. Đã chốt (28/07/2026)

| # | Câu hỏi | Chốt | Đổi sau này ở đâu |
|---|---|---|---|
| 1 | Giới hạn 500 kbps hay 400 kbps? | **500 kbps** (BR-34) — theo bảng mục 3.1 vẫn còn ~550 cuộc/tháng ở mức thực tế | `MAX_VIDEO_BITRATE` trong `lib/webrtc/bitrate.ts`, một chỗ duy nhất |
| 2 | Được trả lời cuộc gọi video bằng chế độ audio? | **Có** (BR-37) — nút "Nhận nhưng không bật camera" ở màn chuông. Chỉ xin micro, KHÔNG xin camera rồi tắt, vì xin quyền là đèn camera đã sáng | `IncomingCallModal` + `acceptIncoming(withCamera)` |
| 3 | Thời lượng tối đa video call? | **Giữ 30 phút** như audio (BR-23) — không có ngoại lệ riêng cho video, đỡ một luật phải nhớ | `MAX_CALL_MS` trong `calls.constants.ts` |
| 4 | Giới hạn số cuộc gọi video mỗi ngày? | **Không** — chưa có dữ liệu thật để đặt ngưỡng; đặt bừa sẽ chặn nhầm người dùng thật. Đo quota TURN trước (mục 8), thiếu thì hạ bitrate hoặc độ phân giải (mục 3.3) trước khi nghĩ tới hạn ngạch | — |

**Hệ quả của chốt #2 cần nhớ:** trả lời ở chế độ audio thì answer không có video track, nên **không bật camera lên giữa cuộc được** — bật là phải thương lượng lại kết nối, đúng thứ mục 4.3 đã hoãn. Vì vậy nút camera bị ẩn hẳn trong trường hợp này thay vì hiện ra rồi báo lỗi.

## 11. Việc dọn dẹp nhân tiện

`frontend/src/lib/webrtc/callContract.ts` đang có ghi chú `TODO(contract)`: contract signaling bị **chép tay hai bản** (FE và `backend/src/modules/calls/calls.types.ts`). Đợt này thêm event `call:media-state` là thêm một chỗ nữa phải sửa hai lần.

Đây là thời điểm hợp lý để dựng `shared/` theo [`api-contract-convention.md`](../04-convention/api-contract-convention.md) mục 3 — nhưng nên làm **PR riêng**, không gộp vào PR video call.
