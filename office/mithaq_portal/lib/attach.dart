import 'package:cross_file/cross_file.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'store.dart';
import 'theme.dart';
import 'util.dart';

enum AttachSource { camera, gallery, file }

/// إرفاق الوثائق: كاميرا الهاتف، المعرض، أو ملف من الجهاز
class Attach {
  static Future<void> sheet(BuildContext context) async {
    final src = await showModalBottomSheet<AttachSource>(
      context: context,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (c) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('إرفاق وثيقة', style: MQ.display(26)),
            Text('يصل المرفق إلى المحامي فوراً ويُحفظ في ملفك لدى المكتب.', style: MQ.body(13, color: MQ.muted)),
            const SizedBox(height: 18),
            Row(children: [
              _opt(c, AttachSource.camera, Icons.photo_camera_outlined, 'الكاميرا', 'صوّر الوثيقة الآن', MQ.pine),
              const SizedBox(width: 10),
              _opt(c, AttachSource.gallery, Icons.photo_library_outlined, 'المعرض', 'صورة محفوظة', MQ.brass),
              const SizedBox(width: 10),
              _opt(c, AttachSource.file, Icons.description_outlined, 'مستند', 'PDF · Word · Excel', MQ.docBlue),
            ]),
          ]),
        ),
      ),
    );
    if (src != null && context.mounted) await pick(context, src);
  }

  static Widget _opt(BuildContext c, AttachSource s, IconData ic, String t, String sub, Color col) => Expanded(
        child: Material(
          color: col.withValues(alpha: .07),
          borderRadius: BorderRadius.circular(20),
          child: InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () => Navigator.pop(c, s),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 6),
              child: Column(children: [
                Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(color: col, shape: BoxShape.circle),
                    child: Icon(ic, color: MQ.onGold, size: 26)),
                const SizedBox(height: 10),
                Text(t, style: MQ.body(14, weight: FontWeight.w700)),
                Text(sub, textAlign: TextAlign.center, style: MQ.body(11, color: MQ.muted, height: 1.3)),
              ]),
            ),
          ),
        ),
      );

  static Future<void> pick(BuildContext context, AttachSource src) async {
    try {
      Uint8List? bytes;
      String name;
      String? mime;
      if (src == AttachSource.file) {
        final r = await FilePicker.platform.pickFiles(
            type: FileType.custom,
            allowedExtensions: const ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'webp', 'heic'],
            withData: true);
        if (r == null || r.files.isEmpty) return;
        final f = r.files.first;
        bytes = f.bytes;
        name = f.name;
        if (bytes == null && !kIsWeb && f.path != null) bytes = await XFile(f.path!).readAsBytes();
      } else {
        final x = await ImagePicker().pickImage(
            source: src == AttachSource.camera ? ImageSource.camera : ImageSource.gallery,
            imageQuality: 82,
            maxWidth: 2400);
        if (x == null) return;
        bytes = await x.readAsBytes();
        mime = x.mimeType;
        name = x.name.isEmpty ? 'صورة.jpg' : x.name;
        if (extOf(name).isEmpty) name = '$name.${mime == 'image/png' ? 'png' : 'jpg'}';
        if (src == AttachSource.camera) name = 'وثيقة مصوّرة ${dmy(DateTime.now()).replaceAll('/', '-')}.${extOf(name)}';
      }
      if (bytes == null) return;
      if (bytes.length > 25 * 1024 * 1024) {
        if (context.mounted) snack(context, 'الملف أكبر من 25 ميغابايت. اختر ملفاً أصغر.');
        return;
      }
      mime = (mime == null || mime.isEmpty) ? mimeOf(name) : mime;
      final image = mime.startsWith('image/');
      if (!context.mounted) return;
      final caption = await _preview(context, bytes, name, image);
      if (caption == null) return;
      store.sendFile(bytes, name, mime, caption: caption, image: image);
      if (context.mounted) snack(context, 'جارٍ إرسال «$name» إلى المحامي');
    } catch (e) {
      if (context.mounted) snack(context, 'تعذّر إرفاق الملف. حاول مجدداً.');
    }
  }

  /// معاينة قبل الإرسال مع ملاحظة اختيارية
  static Future<String?> _preview(BuildContext context, Uint8List bytes, String name, bool image) {
    final ctrl = TextEditingController();
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (c) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(c).viewInsets.bottom),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text('إرسال إلى المحامي', style: MQ.display(24)),
              const SizedBox(height: 12),
              if (image)
                ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 360),
                    child: Image.memory(bytes,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => FileTile(name: name, size: bytes.length)),
                  ),
                )
              else
                FileTile(name: name, size: bytes.length),
              const SizedBox(height: 14),
              TextField(
                controller: ctrl,
                minLines: 1,
                maxLines: 4,
                decoration: const InputDecoration(hintText: 'أضف ملاحظة للمحامي (اختياري)'),
              ),
              const SizedBox(height: 14),
              Row(children: [
                Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(c), child: const Text('إلغاء'))),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: FilledButton.icon(
                    onPressed: () => Navigator.pop(c, ctrl.text.trim()),
                    icon: const Icon(Icons.send_rounded),
                    label: const Text('إرسال'),
                  ),
                ),
              ]),
            ]),
          ),
        ),
      ),
    );
  }
}

/// بطاقة ملف (PDF/Word/Excel)
class FileTile extends StatelessWidget {
  const FileTile({super.key, required this.name, this.size = 0, this.dark = false});
  final String name;
  final num size;
  final bool dark;
  @override
  Widget build(BuildContext context) {
    final (col, label) = extStyle(extOf(name));
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
          color: dark ? Colors.white.withValues(alpha: .1) : MQ.ivory, borderRadius: BorderRadius.circular(14)),
      child: Row(children: [
        Container(
          width: 42,
          height: 50,
          alignment: Alignment.bottomCenter,
          padding: const EdgeInsets.only(bottom: 6),
          decoration: BoxDecoration(color: col, borderRadius: BorderRadius.circular(7)),
          child: Text(label, style: MQ.mono(10, color: Colors.white, weight: FontWeight.w700)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: MQ.body(13.5, weight: FontWeight.w600, color: dark ? Colors.white : MQ.ink, height: 1.35)),
            if (size > 0) Text(fileSize(size), style: MQ.body(11.5, color: dark ? Colors.white70 : MQ.muted)),
          ]),
        ),
      ]),
    );
  }
}
