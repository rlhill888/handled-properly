-- About & Connect page background customization -- the admin can set a
-- solid background color and/or upload a background image behind the
-- profile card and featured list, instead of the page always sitting on
-- the site's plain white background. Both are optional and independent;
-- see about-and-connect/page.tsx for how they're combined (the image, when
-- set, is what actually paints -- the color is what shows while the image
-- itself loads/fails and behind any transparent part of it, not a second
-- competing layer).
alter table site_about_content
  add column background_color text,
  add column background_image_path text;
