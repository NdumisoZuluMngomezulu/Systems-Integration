import 'package:flutter/material.dart';

import 'screens/search_screen.dart';

void main() {
    runApp(const BibleSermonApp());
}

class BibleSermonApp extends StatelessWidget {
    const BibleSermonApp({super.key});

    @override
    Widget build(BuildContext context) {
        return MaterialApp(
            title:'Verse & Sermon Finder',
            theme: ThemeData(
                useMaterial3: true,
                colorScheme: ColorScheme.fromSeed(seedColor : const Color(0xFF1F5E56));
            ),
            home: const SearchScreen(),
        );
    }
}