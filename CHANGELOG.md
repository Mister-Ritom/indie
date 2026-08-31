# Changelog

All notable changes to Indie will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.4] - 2026-08-31

### Added
- Tiered view penalties across Home Feed, Discovery Ideas, and Carousel to prioritize fresh, unviewed content while avoiding empty feeds
- Cold-start & low-exposure boost for newly created pins (< 20 global views) to give all creators fair initial reach
- Normalized multi-label vector matching for fairer AI label matching across pins
- Personalized Hero Carousel powered by user taste vectors and engagement scores
- Diversity interleaving in Home Feed to prevent repetitive aesthetic clumping

### Improved
- Global popularity metric now factors in comments alongside likes and saves
- Added bidirectional user blocking enforcement to Home Feed queries

---

## [1.1.3] - 2026-08-31

### Added
- `app-ads.txt` file published to developer website for AdMob compliance

### Fixed
- Vercel rewrite rule updated to correctly serve `app-ads.txt` at the domain root

---

## [1.1.2] - 2026-08-31

### Added
- Guest users can now view and search posts and profiles without signing in

### Improved
- Better report and block flows
- App-wide upload context for more consistent upload handling
- Better upload reliability

### Fixed
- Various UI bug fixes
- Code quality improvements and type fixes using standard procedures
- Featured boards and pins now refresh correctly

---

## [1.1.1]

### Added
- Apple Sign In support
- Type generation script for Supabase database schema
- Tracking transparency permission utility

### Improved
- UI/UX improvements for large screens
- Prefetch routes for CreatePin and CreateBoard screens for faster navigation
- SafeAreaProvider applied to CreateBoardScreen and CreatePinScreen
- Back buttons added to "not found" pages
- BoardWithPins interface now includes `full_name` in profile

### Fixed
- Increased delay before navigating after closing CreateMenuModal

---

## [1.0.0]

- Initial release
