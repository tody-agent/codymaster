# growth-marketing — extracted from CodyMaster on 2026-05-09

## Old → New

| CodyMaster | growth-marketing |
|---|---|
| `cm-booking-calendar` | `booking-calendar` |
| `cm-growth-hacking` | `growth-hacking` |
| `cm-google-form` | `google-form` |
| `cm-ads-tracker` | `ads-tracker` |
| `cm-cro-methodology` | `cro-methodology` |
| `cm-readit` | `readit` |
| `cm-jtbd` | `jtbd` |

## Slash command

- Old: `/cm:cm-booking-calendar`
- New: `/growth-marketing:booking-calendar`

## Push to its own repo

This folder is staged inside the CodyMaster monorepo. To publish:

```bash
cd extracted-plugins/growth-marketing
git init
git add .
git commit -m "init: extracted from CodyMaster"
git remote add origin https://github.com/tody-agent/growth-marketing.git
git push -u origin main
```
