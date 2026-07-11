# Sidebar + nav translated

## What to build

Replace all hardcoded strings in `SideBar.jsx` and the authenticated `Layout.jsx` header with `t()` calls using the `nav` namespace. This covers navigation link labels, the Sign Out button, and the role name displayed under the user's avatar. The sidebar must appear on the right side of the screen when the document direction is RTL — achieved by natural flex row reversal once all physical directional utilities have been replaced with logical-property equivalents (done in slice 2).

## Acceptance criteria

- [ ] All nav link labels render in Arabic in Arabic mode and English in English mode
- [ ] "Sign Out" button label renders in the selected language
- [ ] The role name shown under the user avatar renders in the selected language
- [ ] Sidebar sits on the right side of the viewport in Arabic (RTL) mode
- [ ] Sidebar sits on the left side of the viewport in English (LTR) mode
- [ ] No hardcoded English navigation strings remain in `SideBar.jsx` or `Layout.jsx`

## Blocked by

- [#0002 i18n foundation + RTL + `LanguageSwitcher` wiring](./0002-i18n-foundation-rtl-language-switcher.md)
