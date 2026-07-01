import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:bible_sermon_finder/main.dart';

void main() {
  testWidgets('App shows the search screen title and a search field',
      (WidgetTester tester) async {
    await tester.pumpWidget(const BibleSermonApp());

    expect(find.text('Verse & Sermon Finder'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
  });
}
