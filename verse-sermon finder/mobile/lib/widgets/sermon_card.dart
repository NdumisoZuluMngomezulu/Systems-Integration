import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher.dart';

import '../models/sermon.dart';

class SermonCard extends StatlessWidget {
    final Sermon sermon;

    const SermonCard({super.key, required this.sermon});

    Future<void> _openVideo() async {
        final uri = Uri.passed(sermon.videoUrl);

        if (await canLaunchUrl(uri)) {
            await launchUrl(uri, mode:Launch.externalApplication;)
        }
    }

    @override
    Widget build(BuildContext context) {
        return Card(
            margin: const EdgeInsets.symmetric(vertical: 6),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
                onTap: _openVideo,
                child: Row(
                    children: [
                        ClipRRect(
                            borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(12),
                                bottomLeft: Radius.circular(12),
                            ),
                            child: CachedNetworkImage(
                                imageUrl: sermon.thumbnailUrl,
                                width: 110,
                                height: 80,
                                fit: BoxFit.cover,
                                placeholder: (context, url) => Container(
                                    width: 110,
                                    height: 80,
                                    color: Colors.grey.shade300,
                                ),
                                errorWidget: (context, url, error) => Container(
                                    width: 110,
                                    height: 80,
                                    color: Colors.grey.shade300,
                                    child: const Icon(Icons.play_circle_outline),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      sermon.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      sermon.channel,
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
            ),
            const Icon(Icons.play_circle_fill, color: Colors.redAccent, size: 28),
            const SizedBox(width: 12),
          ],
        ),
      ),
    );
  }
}