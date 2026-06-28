import 'sermon.dart';
import 'verse.dart';

class SearchResult {
  final String query;
  final List<Verse> verses;
  final List<Sermon> sermons;
  final List<String> warnings;
  final DateTime savedAt;

  SearchResult({
    required this.query,
    required this.verses,
    required this.sermons,
    required this.warnings,
    required this.savedAt,
  });

  factory SearchResult.fromJson(Map<String, dynamic> json) {
    return SearchResult(
      query: json['query'] as String? ?? '',
      verses: (json['verses'] as List<dynamic>? ?? [])
          .map((v) => Verse.fromJson(v as Map<String, dynamic>))
          .toList(),
      sermons: (json['sermons'] as List<dynamic>? ?? [])
          .map((s) => Sermon.fromJson(s as Map<String, dynamic>))
          .toList(),
      warnings: (json['warnings'] as List<dynamic>? ?? [])
          .map((w) => w.toString())
          .toList(),
      savedAt: DateTime.tryParse(json['saved_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}
