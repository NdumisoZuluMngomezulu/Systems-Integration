class HistoryEntry {
  final int id;
  final String queryText;
  final DateTime createdAt;

  HistoryEntry({
    required this.id,
    required this.queryText,
    required this.createdAt,
  });

  factory HistoryEntry.fromJson(Map<String, dynamic> json) {
    return HistoryEntry(
      id: json['id'] as int,
      queryText: json['query_text'] as String? ?? '',
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}
