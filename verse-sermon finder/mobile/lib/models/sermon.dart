class Sermon {
    final String videoId;
    final String title;
    final String channel;
    final String thumbNailUrl;
    final String videoUrl;

    Sermon({
        required this.videoId,
        required this.title,
        required this.channel,
        required this.thumbnailUrl,
        required this.videoUrl,
    });

    factory Sermon.fromJson(Map<String, dynamic> json) {
        return Sermon(
            videoId: json['video_id'] as String? ?? '',
            title: json['title'] as String? ?? '',
            channel: json['channel'] as String? ?? '',
            thumbnailUrl: json['thumbnail_url'] as String? ?? '',
            videoUrl: json['video_url'] as String? ?? '',
        );
    }
}