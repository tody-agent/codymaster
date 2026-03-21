import SwiftUI

struct $name: View {
    let title: String

    // Design tokens from design system
    static let primaryColor = Color(hex: "$primary_color")
    static let secondaryColor = Color(hex: "$secondary_color")
    static let backgroundColor = Color(hex: "$background_color")
    static let textColor = Color(hex: "$text_color")

    init(title: String = "$name") {
        self.title = title
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title)
                .font(.custom("$heading_font", size: 24))
                .fontWeight(.bold)
                .foregroundColor(Self.primaryColor)

            Text("Your content goes here.")
                .font(.custom("$body_font", size: 16))
                .foregroundColor(Self.textColor)

            Button(action: {}) {
                Text("Action")
                    .fontWeight(.semibold)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Self.primaryColor)
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
        }
        .padding(24)
        .background(Self.backgroundColor)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 6, x: 0, y: 4)
    }
}

// Color extension for hex
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: Double(a) / 255)
    }
}

#Preview {
    $name()
}
