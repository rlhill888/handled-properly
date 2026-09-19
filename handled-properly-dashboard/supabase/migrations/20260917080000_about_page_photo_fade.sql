-- The About & Connect profile photo's dark bottom fade (the gradient that
-- darkens the photo toward the name/bio/social row so white text stays
-- legible over it) becomes admin-adjustable instead of a fixed value --
-- see about-and-connect.module.css's .profileScrim, which scales its own
-- gradient stops off this. 0-100: 0 is no darkening at all, 100 is the
-- original fixed design (peaks at 95% opacity black). Defaults to the
-- value that reproduces the existing look exactly, so existing rows don't
-- change appearance until an admin actually adjusts it.
alter table site_about_content
  add column profile_fade_intensity smallint not null default 95
    check (profile_fade_intensity between 0 and 100);
