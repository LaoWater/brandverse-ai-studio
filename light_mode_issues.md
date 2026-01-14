I. Notification (Bottom right) - white text on white bg:
Example text: "Company Updated" - but also others.
Coming from:
html.light .bg-background {
    background-color: rgb(250 251 252) !important;
}

This setting works for the rest of the webiste, but we need it not to affect the notifications - as they become un-readable.
Need a blue-ish background for this without affecting anything else.




II. Media Studio - 
"Create New", "Library" - buttons are black text - ONLY ON SELECTED BUTTON it is crucial we have WHITE text
Coming From 
.light .text-white:not(.cosmic-button):not(.cosmic-button *):not(.moon-icon) {
    color: rgb(15 15 23) !important;
}
But again, this affects sooo many other buttons and text, which are completely correct and we do not want them to be modified, only the selected button here.
We need a surgical minimum invasive way of achieving this.

Also - affected by this is the seconds indicator in Library - which ends up in light mode as - black text on black bg - which is un-readable.

Maybe we can change the bg if changing the rule breaks everything