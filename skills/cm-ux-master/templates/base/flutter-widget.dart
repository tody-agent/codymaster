import 'package:flutter/material.dart';

class $name extends StatelessWidget {
  final String title;

  const $name({
    super.key,
    this.title = '$name',
  });

  // Design tokens from design system
  static const primaryColor = Color(0xFF$primary_color_hex);
  static const secondaryColor = Color(0xFF$secondary_color_hex);
  static const backgroundColor = Color(0xFF$background_color_hex);
  static const textColor = Color(0xFF$text_color_hex);
  static const headingFont = '$heading_font';
  static const bodyFont = '$body_font';

  @override
  Widget build(BuildContext context) {
    return Card(
      color: backgroundColor,
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontFamily: headingFont,
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: primaryColor,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Your content goes here.',
              style: TextStyle(
                fontFamily: bodyFont,
                fontSize: 16,
                color: textColor,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Action', style: TextStyle(fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }
}
