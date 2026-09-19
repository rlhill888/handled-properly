-- profile_fade_intensity's meaning changed: it no longer scales a dark
-- overlay's strength -- it's now the percentage of the profile photo's own
-- height (from the bottom) that fades to transparent, revealing the page
-- behind the card, per about-and-connect.module.css's .profileImage mask.
-- 95 (a near-total dissolve) made sense as the "reproduce the old fixed
-- design" default for the old darkening behavior; it doesn't for this one,
-- so both the column default and the existing row move to a more
-- reasonable middle value.
alter table site_about_content
  alter column profile_fade_intensity set default 40;

update site_about_content set profile_fade_intensity = 40 where id = 1;
