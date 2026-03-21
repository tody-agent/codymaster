import re
import json

with open('docs/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# We only want to target certain textual segments manually to be safe, 
# or use a regex that matches tags with text inside.
# A simpler approach: Define a dictionary of Exact Match -> (Key, en_translation) 
# and do a safe replacement on the HTML string.

translations = {
    # Nav
    "Why": ("nav_why", "Why"),
    "Magic": ("nav_magic", "Magic"),
    "How": ("nav_how", "How"),
    "Start Free": ("nav_start", "Start Free"),
    "Try It\n        Free →": ("nav_try", "Try It\n        Free →"),

    # Hero
    "Founders & PMs đang dùng trên 6 nền tảng AI": ("hero_badge", "Founders & PMs using on 6 AI platforms"),
    "Bạn nói ý\n          tưởng.": ("hero_h1a", "You speak the\n          idea."),
    "AI biến\n          nó thành sản phẩm đẹp.": ("hero_h1b", "AI turns\n          it into beautiful products."),
    "Không cần biết code. Không cần thuê designer.": ("hero_p1", "No coding skills needed. No designer required."),
    "biến mọi AI tool thành design studio chuyên nghiệp.": ("hero_p2", "turns any AI tool into a professional design studio."),
    "Hoạt động với Cursor, Claude, Gemini, Amp, và mọi AI\n        coding tool bạn đang dùng.": ("hero_p3", "Works with Cursor, Claude, Gemini, Amp, and any AI\n        coding tool you use."),
    "✦\n          Bắt đầu miễn phí — 60 giây": ("hero_cta1", "✦\n          Start Free — 60 seconds"),
    "Xem\n          phép màu ↓": ("hero_cta2", "See\n          the magic ↓"),
    "Quy tắc thiết kế": ("hero_stat1", "Design Rules"),
    "Cài đặt xong": ("hero_stat2", "Setup Time"),
    "Chi phí designer": ("hero_stat3", "Designer Cost"),
    "Nền tảng AI": ("hero_stat4", "AI Platforms"),

    # Problem
    "Vấn đề thật sự": ("prob_tag", "The Real Problem"),
    "Bạn có ý tưởng tuyệt vời.<br>Nhưng AI\n        tạo ra UI... xấu.": ("prob_h2", "You have a great idea.<br>But AI\n        creates ugly UI."),
    "Đây là thực trạng mà 90% founders và PMs đang gặp phải.": ("prob_sub", "This is the reality 90% of founders and PMs face."),
    
    "Không có UX Master": ("prob_no_ux", "Without UX Master"),
    "UI trông\n              \"AI-generated\" — generic, không chuyên nghiệp": ("prob_no_1", "UI looks\n              \"AI-generated\" — generic, unprofessional"),
    "Mỗi trang một\n              style — không có design system nhất quán": ("prob_no_2", "Every page different\n              style — no consistent design system"),
    "User bị\n              confused — nút bấm nhỏ, menu quá nhiều item, load chậm": ("prob_no_3", "Users get\n              confused — tiny buttons, crowded menus, slow loads"),
    "Thuê\n              designer: $3,000–$15,000. Chờ 2–4 tuần.": ("prob_no_4", "Hire a\n              designer: $3,000–$15,000. Wait 2–4 weeks."),
    "Không biết\n              design đúng hay sai — \"trông ổn\" ≠ chuyển đổi tốt": ("prob_no_5", "Don't know if\n              design is right — \"looks fine\" ≠ converts well"),

    "Với UX Master": ("prob_with_ux", "With UX Master"),
    "UI đẹp\n              chuẩn studio — khách hàng <span class=\"text-white font-medium\">wow</span> ngay lần đầu": ("prob_yes_1", "Beautiful studio\n              quality UI — customers say <span class=\"text-white font-medium\">wow</span> at first sight"),
    "Design\n              system tự động — mọi trang đồng bộ, chuyên nghiệp": ("prob_yes_2", "Auto design\n              system — every page synchronized and professional"),
    "48 quy\n              luật UX khoa học — user <span class=\"text-white font-medium\">thích dùng</span> & quay lại": ("prob_yes_3", "48 scientific\n              UX laws — users <span class=\"text-white font-medium\">love using it</span> & return"),
    "$0 chi\n              phí. 0 chờ đợi. Kết quả trong <span class=\"text-white font-medium\">vài phút</span>.": ("prob_yes_4", "$0\n              cost. 0 wait. Results in <span class=\"text-white font-medium\">minutes</span>."),
    "37 bài\n              test chất lượng tự động — biết chính xác đâu cần sửa": ("prob_yes_5", "37 automated\n              quality tests — know exactly what to fix"),

    "\"Sản phẩm tốt không chỉ hoạt động đúng — nó phải <span\n          class=\"text-white\">cảm thấy đúng</span>.\"": ("prob_quote", "\"A great product doesn't just work right — it must <span\n          class=\"text-white\">feel right</span>.\""),

    # Magic
    "Phép màu": ("magic_tag", "The Magic"),
    "Chỉ cần nói. AI hiểu bạn muốn gì.": ("magic_h2", "Just speak. AI understands what you want."),
    "UX Master hoạt động ngầm — tự động biến mọi yêu cầu thành\n        thiết kế chuyên nghiệp.": ("magic_sub", "UX Master works silently — automatically turning every request into\n        professional design."),
    "Bạn": ("magic_you", "You"),
    "\"Tạo cho tôi\n            landing page cho dịch vụ spa cao cấp, phong cách sang trọng, có booking form\"": ("magic_prompt", "\"Create a luxury spa landing page, premium style, with booking form\""),
    "AI": ("magic_ai", "AI"),
    "✦ UX Master đang phân tích...": ("magic_analyzing", "✦ UX Master is analyzing..."),
    "🎨 <span class=\"text-zinc-200\">Style:</span> Glassmorphism + Soft UI — hoàn hảo cho luxury spa": ("magic_a1", "🎨 <span class=\"text-zinc-200\">Style:</span> Glassmorphism + Soft UI — perfect for luxury spa"),
    "🎯 <span class=\"text-zinc-200\">Màu sắc:</span> Soft pink + Calming teal trên nền tối": ("magic_a2", "🎯 <span class=\"text-zinc-200\">Colors:</span> Soft pink + Calming teal on dark background"),
    "✍️ <span class=\"text-zinc-200\">Font:</span> Playfair Display / Lato — sang trọng, dễ đọc": ("magic_a3", "✍️ <span class=\"text-zinc-200\">Font:</span> Playfair Display / Lato — elegant, readable"),
    "⚖️ <span class=\"text-zinc-200\">UX Law:</span> Hick's Law — tối đa 2 nút CTA trên hero": ("magic_a4", "⚖️ <span class=\"text-zinc-200\">UX Law:</span> Hick's Law — max 2 CTAs on hero"),
    "🧪 <span class=\"text-zinc-200\">Test:</span> Nút booking ≥ 44px, form ≤ 4 fields": ("magic_a5", "🧪 <span class=\"text-zinc-200\">Test:</span> Booking button ≥ 44px, form ≤ 4 fields"),
    "Tôi đã tạo\n              landing page cho Serenity Spa với thiết kế Glassmorphism sang trọng. Booking form chỉ 3 bước, nút CTA nổi\n              bật, tuân thủ 48 quy luật UX...": ("magic_output", "I have created the landing page for Serenity Spa with luxury Glassmorphism design. 3-step booking form, prominent CTA button, adheres to 48 UX laws..."),

    "Tự động chọn design đẹp": ("feature_1_title", "Auto-selects beautiful design"),
    "Từ 67 phong cách thiết kế — UX Master tự chọn style phù hợp\n          nhất cho ngành của bạn.": ("feature_1_desc", "From 67 design styles — UX Master auto-picks the perfect match for your industry."),
    "48 quy luật UX khoa học": ("feature_2_title", "48 scientific UX laws"),
    "Nút bấm đủ lớn, menu không quá dài, load nhanh, form ngắn gọn —\n          tất cả được tự động áp dụng.": ("feature_2_desc", "Buttons large enough, menus not too long, fast loads, short forms — all automatically applied."),
    "Tự kiểm tra chất lượng": ("feature_3_title", "Auto-quality checks"),
    "37 bài test tự động đảm bảo sản phẩm đạt chuẩn. Contrast đủ?\n          Responsive? Accessible?": ("feature_3_desc", "37 automated tests ensure standard compliance. Contrast sufficient? Responsive? Accessible?"),
    "Copy design từ site yêu thích": ("feature_4_title", "Clone your favorite sites"),
    "Thích design của Linear, Stripe hay Airbnb? UX Master trích\n          xuất màu sắc, font, spacing.": ("feature_4_desc", "Love Linear, Stripe, or Airbnb's design? UX Master extracts colors, fonts, spacing."),
    "Mọi AI tool đều dùng được": ("feature_5_title", "Works with any AI tool"),
    "Cursor, Claude, Gemini, Amp, OpenCode — cài 1 lần, dùng mãi.": ("feature_5_desc", "Cursor, Claude, Gemini, Amp, OpenCode — install once, use forever."),
    "Tối ưu conversion rate": ("feature_6_title", "Optimizes conversion rates"),
    "CTA đặt đúng chỗ, form ngắn gọn, flow mượt mà — tăng tỷ lệ\n          chuyển đổi ngay từ lần đầu.": ("feature_6_desc", "CTAs placed right, concise forms, smooth flow — instantly boosts conversion rates."),

    # Who is this for
    "Dành cho ai?": ("who_tag", "Who is this for?"),
    "Bạn không cần biết code.<br>Bạn chỉ\n        cần biết mình muốn gì.": ("who_h2", "You don't need to code.<br>You just need to know what you want."),
    
    "🚀 Startup Founders": ("persona_1", "🚀 Startup Founders"),
    "Ship MVP đẹp hơn — gọi vốn tự tin hơn.": ("persona_1_desc", "Ship better looking MVPs — pitch with confidence."),
    "📋 Product Managers": ("persona_2", "📋 Product Managers"),
    "Biến PRD thành prototype đẹp — không cần chờ design team.": ("persona_2_desc", "Turn PRDs into beautiful prototypes — no waiting for design teams."),
    "💼 Business Owners": ("persona_3", "💼 Business Owners"),
    "Website, landing page, dashboard — professional quality, zero\n          cost.": ("persona_3_desc", "Website, landing pages, dashboards — professional quality, zero cost."),
    "🎯 Growth & Marketing": ("persona_4", "🎯 Growth & Marketing"),
    "Landing page chuyển đổi cao. A/B test visual nhanh.": ("persona_4_desc", "High-converting landing pages. Fast visual A/B tests."),
    "✨ Vibe Coders": ("persona_5", "✨ Vibe Coders"),
    "Bạn nói AI làm — UX Master đảm bảo kết quả đẹp & đúng chuẩn.": ("persona_5_desc", "You speak, AI codes — UX Master ensures beautiful & standard-compliant results."),
    "💡 Solo Makers": ("persona_6", "💡 Solo Makers"),
    "Một người = cả team. UX Master là designer trong túi của bạn.": ("persona_6_desc", "One person = entire team. UX Master is the designer in your pocket."),

    # How
    "Đơn giản đến bất ngờ": ("how_tag", "Surprisingly simple"),
    "3 bước. Xong.": ("how_h2", "3 steps. Done."),
    "Không cần học gì mới. Không cần cài package. Không cần config.": ("how_sub", "No learning curve. No packages to install. No config required."),
    "Cài đặt": ("how_s1_title", "Install"),
    "Chạy 1 lệnh duy nhất. UX Master tự nhận diện AI tool bạn\n          đang dùng.": ("how_s1_desc", "Run a single command. UX Master auto-detects the AI tool you're using."),
    "Gọi tên": ("how_s2_title", "Invoke"),
    "Thêm <code class=\"text-xs text-magic\">@ux-master</code> vào prompt của bạn.": ("how_s2_desc", "Add <code class=\"text-xs text-magic\">@ux-master</code> to your prompt."),
    "Tận hưởng": ("how_s3_title", "Enjoy"),
    "AI tự động áp dụng 838+ quy tắc thiết kế vào code của bạn.": ("how_s3_desc", "AI automatically applies 838+ design rules to your code."),

    # Proof
    "Kết quả thật": ("proof_tag", "Real Results"),
    "Không phải lời hứa. Là kết quả.": ("proof_h2", "Not promises. Just results."),
    "Trước UX Master, AI tạo UI như student project. Giờ khách\n          hàng hỏi \"bạn thuê agency nào design?\"": ("proof_q1", "Before UX Master, AI created student-project UI. Now clients ask \"which agency designed this?\""),
    "Là dân backend, CSS luôn là ác mộng. UX Master giúp tôi làm ra\n          dashboard nhìn xịn như Stripe.": ("proof_q2", "As a backend dev, CSS was a nightmare. UX Master helps me build Stripe-level dashboards."),
    "Tôi không biết code, không biết design. Nhưng với Cursor +\n          UX Master, tôi ship được app đầu tiên trong 1 ngày.": ("proof_q3", "I don't code, I don't design. But with Cursor + UX Master, I shipped my first app in 1 day."),

    # Use Cases
    "Mọi ngành, mọi sản phẩm": ("use_tag", "Every Industry, Every Product"),
    "UX Master biết ngành của bạn.": ("use_h2", "UX Master knows your industry."),
    "838+ quy tắc thiết kế được ánh xạ vào 13 lĩnh vực.": ("use_sub", "838+ design rules mapped across 13 domains."),

    # Start
    "Bắt đầu ngay": ("start_tag", "Start Now"),
    "60 giây. Miễn phí. Mãi mãi.": ("start_h2", "60 seconds. Free. Forever."),
    "Chỉ cần Python (đã cài sẵn trên Mac/Linux). Không cần thẻ tín\n        dụng.": ("start_sub", "Only requires Python (pre-installed on Mac/Linux). No credit card required."),
    "Cài đặt tự động (Khuyên dùng)": ("start_op1", "Auto Install (Recommended)"),
    "Tự detect AI tool & cài đặt phù hợp": ("start_op1_desc", "Auto detects AI tool & installs properly"),
    "→ Chọn: Cursor, Claude, Gemini, Amp, hoặc All": ("start_hint", "→ Select: Cursor, Claude, Gemini, Amp, or All"),

    # Under the hood
    "Under the Hood": ("data_tag", "Under the Hood"),
    "838+ quy tắc. 13 domains. Không phải\n        template.": ("data_h2", "838+ rules. 13 domains. Not a template."),
    "Mỗi quy tắc được ánh xạ theo ngành, loại sản phẩm, và context\n        cụ thể.": ("data_sub", "Every rule is mapped by industry, product type, and specific context."),
    "Quy tắc Colors & Theme": ("data_1", "Color & Theme Rules"),
    "Quy tắc Typography": ("data_2", "Typography Rules"),
    "Quy tắc Bố cục": ("data_3", "Layout Rules"),
    "Quy tắc Box & Shadow": ("data_4", "Box & Shadow Rules"),
    "Quy luật UX": ("data_5", "UX Laws"),
    "Tiêu chuẩn Accessibility": ("data_6", "Accessibility Standards"),
    "Ngành hàng tối ưu": ("data_7", "Optimized Industries"),
    "Tự động Test": ("data_8", "Automated Tests"),

    # Pricing
    "Pricing": ("price_tag", "Pricing"),
    "Free forever. Pro when you need power.\n      ": ("price_h2", "Free forever. Pro when you need power."),
    "838+ rules free. Upgrade to Pro for Harvester v3, Token\n        Mapper, and the full design extraction pipeline.": ("price_sub", "838+ rules free. Upgrade to Pro for Harvester v3, Token Mapper, and the full design extraction pipeline."),
    
    "Free forever, no catch": ("price_free_sub", "Free forever, no catch"),
    "forever": ("price_free_dur", "forever"),
    "838+ design rules": ("ft_rules", "838+ design rules"),
    "48 UX Laws": ("ft_ux", "48 UX Laws"),
    "37 Design Tests": ("ft_tests", "37 Design Tests"),
    "67 UI styles, 96 color\n            palettes": ("ft_styles", "67 UI styles, 96 color palettes"),
    "6 AI platform support": ("ft_platform", "6 AI platform support"),
    "Harvester v1 (~15\n            tokens)": ("ft_harv1", "Harvester v1 (~15 tokens)"),
    "Harvester v3 (80+ tokens)": ("ft_harv3", "Harvester v3 (80+ tokens)"),
    "Token Mapper": ("ft_mapper", "Token Mapper"),
    "Design Doc Generator": ("ft_docgen", "Design Doc Generator"),
    "Multi-Project Registry": ("ft_registry", "Multi-Project Registry"),
    
    "Get\n          Started Free": ("price_free_cta", "Get Started Free"),

    "Most Popular": ("price_popular", "Most Popular"),
    "One-time payment. Yours forever.": ("price_pro_sub", "One-time payment. Yours forever."),
    "61% off": ("price_discount", "61% off"),
    "slots left": ("price_slots", "slots left"),
    "Price increases to $49 after 100 copies. Never this low again.": ("price_increase", "Price increases to $49 after 100 copies. Never this low again."),
    "Everything in Free": ("pt_all", "Everything in Free"),
    "Harvester v3\n            — 80+ tokens 🔥": ("pt_harv3", "Harvester v3 — 80+ tokens 🔥"),
    "Token Mapper\n            → CSS/Figma 🔥": ("pt_mapper", "Token Mapper → CSS/Figma 🔥"),
    "Multi-Harvest Merge +\n            Confidence": ("pt_merge", "Multi-Harvest Merge + Confidence"),
    "Semi MCP Bridge": ("pt_mcp", "Semi MCP Bridge"),
    "All future updates\n            included": ("pt_updates", "All future updates included"),
    "Priority support": ("pt_support", "Priority support"),
    "Get UX Master Pro — $39": ("price_pro_cta", "Get UX Master Pro — $39"),

    # Pricing Table
    "Free vs Pro — Detailed Comparison": ("price_compare", "Free vs Pro — Detailed Comparison"),
    "Feature": ("price_feat", "Feature"),
    "Design Rules": ("pf_rules", "Design Rules"),
    "UX Laws": ("pf_ux", "UX Laws"),
    "Design Tests": ("pf_tests", "Design Tests"),
    "UI Styles": ("pf_styles", "UI Styles"),
    "Platform Support": ("pf_platform", "Platform Support"),
    "Color Histogram": ("pf_histogram", "Color Histogram"),
    "Semantic Colors": ("pf_semantic", "Semantic Colors"),
    "Neutral Scale": ("pf_neutral", "Neutral Scale"),
    "Component Blueprints": ("pf_blueprint", "Component Blueprints"),
    "Typography Scale": ("pf_typo", "Typography Scale"),
    "Shadow/Border System": ("pf_shadow", "Shadow/Border System"),
    "Layout Metrics": ("pf_layout", "Layout Metrics"),

    # FAQ
    "Frequently Asked Questions": ("faq_title", "Frequently Asked Questions"),
    "Is it really lifetime access?": ("faq_q1", "Is it really lifetime access?"),
    "Yes. Pay once, yours forever. All future updates included at no extra cost.": ("faq_a1", "Yes. Pay once, yours forever. All future updates included at no extra cost."),
    "Will the price go up?": ("faq_q2", "Will the price go up?"),
    "Yes. Every 100 sales, the price increases permanently. Current tier: $39.\n            Next tier: $49. It will never be this low again.": ("faq_a2", "Yes. Every 100 sales, the price increases permanently. Current tier: $39. Next tier: $49. It will never be this low again."),
    "What about refunds?": ("faq_q3", "What about refunds?"),
    "14-day no-questions-asked refund. Try it risk-free.": ("faq_a3", "14-day no-questions-asked refund. Try it risk-free."),
    "Can I use it with any AI tool?": ("faq_q4", "Can I use it with any AI tool?"),
    "Free tier works with Cursor, Claude, Gemini, Amp, OpenCode, Antigravity. Pro\n            features work locally via CLI — no cloud dependency.": ("faq_a4", "Free tier works with Cursor, Claude, Gemini, Amp, OpenCode, Antigravity. Pro features work locally via CLI — no cloud dependency."),
    "Do I need coding skills?": ("faq_q5", "Do I need coding skills?"),
    "Free tier: No. Just install and use your AI tool normally. Pro features:\n            basic terminal knowledge (copy-paste commands).": ("faq_a5", "Free tier: No. Just install and use your AI tool normally. Pro features: basic terminal knowledge (copy-paste commands)."),

    # Final CTA
    "Price increases to <span class=\"text-white font-medium\">$49</span> in <span\n          class=\"text-accent-light font-medium\" id=\"finalSlotCount\">27</span> sales. This is the lowest it will ever be.": ("final_cta_msg", "Price increases to <span class=\"text-white font-medium\">$49</span> in <span class=\"text-accent-light font-medium\" id=\"finalSlotCount\">27</span> sales. This is the lowest it will ever be."),

    # Share
    "Biết ai đang build sản phẩm?<br>Gửi\n        cho họ.": ("share_h2", "Know someone building a product?<br>Share with them."),
    "Mỗi founder, PM, hay maker bạn giới thiệu là thêm một sản\n        phẩm đẹp hơn ra đời.": ("share_sub", "Every founder, PM, or maker you refer means one more beautiful product born."),
    "Share on X": ("share_x", "Share on X"),
    "Share on\n          LinkedIn": ("share_in", "Share on LinkedIn"),
    "Copy\n          Link": ("share_link", "Copy Link"),

    # Footer
    "Biến AI thành design studio của bạn.": ("footer_sub", "Turn AI into your design studio."),
    "Hướng dẫn": ("footer_guide", "Guide"),
    "Miễn phí mãi mãi": ("footer_f1", "Free forever"),
    "6 nền tảng AI": ("footer_f2", "6 AI platforms"),
    "838+ quy tắc\n          design": ("footer_f3", "838+ design rules"),
    "Bạn mơ nó. AI xây nó. UX Master làm nó đẹp.": ("footer_tagline", "You dream it. AI builds it. UX Master makes it beautiful.")
}

vi_json = {}
en_json = {}

for old_text, (key, en_text) in translations.items():
    # Only replace if old_text is actually in HTML
    if old_text in html:
        # Wrap old_text in data-i18n
        new_text = f'<span data-i18n="{key}">{old_text}</span>'
        html = html.replace(old_text, new_text)
        vi_json[key] = old_text.replace('\n', ' ').strip()
        en_json[key] = en_text.replace('\n', ' ').strip()

# Some texts might be part of an existing element (e.g. <a href...>text</a>). 
# We should intelligently just add data-i18n to the element instead of wrapping in <span> if possible.
# Actually, wrapping in <span> is perfectly valid HTML and safer than regex parsing attributes.
with open('docs/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('docs/js/lang/vi.js', 'w', encoding='utf-8') as f:
    f.write(f'export const vi = {json.dumps(vi_json, ensure_ascii=False, indent=2)};')

with open('docs/js/lang/en.js', 'w', encoding='utf-8') as f:
    f.write(f'export const en = {json.dumps(en_json, ensure_ascii=False, indent=2)};')

print("Translation mapped and replaced. Keys found:", len(vi_json))

