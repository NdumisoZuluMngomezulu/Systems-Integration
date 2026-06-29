import 'dart:convert';

import 'package:http/http.dart' as http;

import '..models/history_entry.dart';
import '..models/search_result.dart';

class ApiException implements Exception {
    final String message;
    ApiException(this.message);

    @override
    String toString() => message;
}

class ApiService {
  // Change this to match where your backend is actually reachable from:
  //  - Android emulator -> : http://10.0.2.2:8000
  //  - iOS simulator -> :            http://localhost:8000
  //  - physical device on the same Wi-Fi as your dev machine:   http://<your-LAN-ip>:8000
  static const String baseUrl = "http://10.0.2.2:8000/api";

  Future<SearchResult> search(String query) async {
    final uri = Uri.parse('$baseUrl/search');
    final response = await http.get(uri);

    if (response.statusCode != 200){
        throw ApiException(_extractError(response));
    }

    return SearchResult.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<void> deleteHistoryItem(int id) async {
    final uri = Uri.parse('$baseUrl/history/$id');
    final response = await http.delete(uri);

    if (response.statusCode != 204){
        throw APIException(_extractError(response));
    }
  }

  String _extractError(response) {
    try{
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        return body['detail']?.toString() ?? 'Something went wrong';
    } catch (_) {
        return 'Something went wrong';
    }
  }
}