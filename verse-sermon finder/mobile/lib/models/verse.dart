class Verse {
    final String ref;
    final String text;
    final String? book;
    final String? testament;

    Verse({
        required this.ref,
        required this.text,
        this.book,
        this.testament,
    });

    factory Verse.fromJson(Map<String, dynamic> json) {
        return Verse(
            ref: json['ref'] as String? ?? '',
            text: json['text'] as String? ?? '',
            book: json['book'] as String?,
            testament: json['testament'] as String?,
        );
    }
}