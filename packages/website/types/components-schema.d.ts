import {StoryblokStory} from 'storyblok-generate-ts'

export interface BlogAsideStoryblok {
  author?: BlogAuthorStoryblok[];
  socialSharing?: SocialSharingStoryblok[];
  readingTime?: string;
  date?: string;
  _uid: string;
  component: "blog-aside";
}

export interface AssetStoryblok {
  _uid?: string;
  id: number | null;
  alt: string | null;
  name: string;
  focus: string | null;
  source: string | null;
  title: string | null;
  filename: string;
  copyright: string | null;
  fieldtype?: string;
  meta_data?: null | {};
  is_external_url?: boolean;
}

export interface BlogAuthorStoryblok {
  name?: string;
  byline?: string;
  image_src?: AssetStoryblok;
  image_alt?: string;
  image_fullWidth: boolean;
  image_aspectRatio?: "" | "wide" | "square" | "vertical";
  links?: LinksStoryblok[];
  _uid: string;
  component: "blog-author";
}

export interface BlogHeadStoryblok {
  date?: string;
  tags?: TagsStoryblok[];
  headline?: string;
  image?: AssetStoryblok;
  alt?: string;
  _uid: string;
  component: "blog-head";
}

export interface BlogOverviewStoryblok {
  section?: SectionStoryblok[];
  latestTitle?: string;
  latest?: BlogTeaserStoryblok[];
  listTitle?: string;
  list?: BlogTeaserStoryblok[];
  moreTitle?: string;
  more?: BlogTeaserStoryblok[];
  cta?: CtaStoryblok[];
  seo?: SeoStoryblok[];
  _uid: string;
  component: "blog-overview";
}

export interface BlogPostStoryblok {
  head?: BlogHeadStoryblok[];
  aside?: BlogAsideStoryblok[];
  content?: string;
  section?: SectionStoryblok[];
  cta?: CtaStoryblok[];
  seo?: SeoStoryblok[];
  _uid: string;
  component: "blog-post";
}

export type MultilinkStoryblok =
  | {
      id?: string;
      cached_url?: string;
      anchor?: string;
      linktype?: "story";
      target?: "_self" | "_blank";
    }
  | {
      url?: string;
      cached_url?: string;
      anchor?: string;
      linktype?: "asset" | "url";
      target?: "_self" | "_blank";
    }
  | {
      email?: string;
      linktype?: "email";
      target?: "_self" | "_blank";
    };

export interface BlogTeaserStoryblok {
  date?: string;
  tags?: TagsStoryblok[];
  headline?: string;
  teaserText?: string;
  image?: AssetStoryblok;
  alt?: string;
  link_url?: MultilinkStoryblok;
  link_text?: string;
  readingTime?: string;
  author_name?: string;
  author_title?: string;
  author_image?: AssetStoryblok;
  _uid: string;
  component: "blog-teaser";
}

export interface BusinessCardStoryblok {
  centered: boolean;
  image_src?: MultilinkStoryblok;
  image_alt?: string;
  logo_src?: MultilinkStoryblok;
  logo_alt?: string;
  logo_url?: MultilinkStoryblok;
  topic?: string;
  address?: string;
  avatar_src?: MultilinkStoryblok;
  avatar_alt?: string;
  contact?: ContactStoryblok[];
  buttons?: ButtonsStoryblok[];
  _uid: string;
  component: "business-card";
}

export interface ButtonsStoryblok {
  label?: string;
  url?: MultilinkStoryblok;
  _uid: string;
  component: "buttons";
}

export interface CategoriesStoryblok {
  label?: string;
  _uid: string;
  component: "categories";
}

export interface CategoryCheckboxesStoryblok {
  entry?: string;
  _uid: string;
  component: "categoryCheckboxes";
}

export interface ComponentTypesStoryblok {
  entry?: string;
  _uid: string;
  component: "componentTypes";
}

export interface ContactStoryblok {
  label?: string;
  icon?: string;
  url?: MultilinkStoryblok;
  _uid: string;
  component: "contact";
}

export interface ContentNavStoryblok {
  image_src?: MultilinkStoryblok;
  image_alt?: string;
  topic?: string;
  links?: LinksStoryblok[];
  initiallyShown?: string;
  _uid: string;
  component: "content-nav";
}

export interface CtaStoryblok {
  headline?: string;
  sub?: string;
  text?: string;
  inverted: boolean;
  buttons?: ButtonsStoryblok[];
  image_src?: AssetStoryblok;
  image_padding: boolean;
  image_alt?: string;
  image_align?: "" | "center" | "top" | "bottom";
  order_mobileImageLast: boolean;
  order_desktopImageLast: boolean;
  _uid: string;
  component: "cta";
}

export interface DatesStoryblok {
  date?: string;
  time?: string;
  label?: string;
  url?: MultilinkStoryblok;
  newTab: boolean;
  ariaLabel?: string;
  _uid: string;
  component: "dates";
}

export interface DividerStoryblok {
  variant?: "" | "default" | "accent";
  _uid: string;
  component: "divider";
}

export interface DownloadStoryblok {
  name?: string;
  description?: string;
  previewImage?: AssetStoryblok;
  url?: MultilinkStoryblok;
  size?: string;
  format?: string;
  _uid: string;
  component: "download";
}

export interface DownloadsStoryblok {
  download?: DownloadStoryblok[];
  _uid: string;
  component: "downloads";
}

export interface EventDetailStoryblok {
  title?: string;
  categories?: CategoriesStoryblok[];
  intro?: string;
  locations?: LocationsStoryblok[];
  download?: DownloadStoryblok[];
  description?: string;
  images?: ImagesStoryblok[];
  button_label?: string;
  button_url?: MultilinkStoryblok;
  _uid: string;
  component: "event-detail";
}

export interface EventFilterStoryblok {
  datePicker_title?: string;
  "datePicker_tab-46748e92-cb39-45b1-8c6b-feaaa0151db1"?: unknown;
  "datePicker_tab-3c8da419-838a-406d-b629-82c27e4768a5"?: unknown;
  datePicker_toggle: boolean;
  categories_title?: string;
  categories_categoryCheckboxes?: CategoryCheckboxesStoryblok[];
  categories_toggle: boolean;
  applyButton_label?: string;
  applyButton_onClick?: string;
  resetButton_label?: string;
  resetButton_onClick?: string;
  "datePicker_tab-b2bafaad-3f40-41ed-85b3-d522d8454e83"?: unknown;
  "datePicker_tab-4bf75069-8edd-4b6a-8200-687bd5b40051"?: unknown;
  _uid: string;
  component: "event-filter";
}

export interface EventLatestTeaserStoryblok {
  date?: string;
  calendar_month?: string;
  calendar_day?: string;
  title?: string;
  location?: string;
  url?: MultilinkStoryblok;
  cta?: string;
  ariaLabel?: string;
  className?: string;
  _uid: string;
  component: "event-latest-teaser";
}

export interface EventListStoryblok {
  filter?: EventFilterStoryblok[];
  events?: EventListTeaserStoryblok[];
  _uid: string;
  component: "event-list";
}

export interface EventListTeaserStoryblok {
  category?: string;
  title?: string;
  text?: string;
  date?: string;
  time?: string;
  location_name?: string;
  location_address?: string;
  tags?: TagsStoryblok[];
  image_src?: AssetStoryblok;
  image_alt?: string;
  url?: MultilinkStoryblok;
  ctaText?: string;
  ariaLabel?: string;
  className?: string;
  _uid: string;
  component: "event-list-teaser";
}

export interface FaqStoryblok {
  questions?: QuestionsStoryblok[];
  _uid: string;
  component: "faq";
}

export interface FeatureStoryblok {
  title?: string;
  text?: string;
  cta_url?: MultilinkStoryblok;
  cta_label?: string;
  _uid: string;
  component: "feature";
}

export interface FeaturesStoryblok {
  layout?: "" | "largeTiles" | "smallTiles" | "list";
  style?: "" | "intext" | "stack" | "centered" | "besideLarge" | "besideSmall";
  ctas_toggle: boolean;
  ctas_style?: "" | "button" | "link" | "intext";
  feature?: FeatureStoryblok[];
  _uid: string;
  component: "features";
}

export interface FooterStoryblok {
  logo_src?: AssetStoryblok;
  logo_srcInverted?: AssetStoryblok;
  logo_alt?: string;
  logo_homepageHref?: MultilinkStoryblok;
  logo_width?: string;
  logo_height?: string;
  byline?: string;
  navItems?: NavItemsStoryblok[];
  _uid: string;
  component: "footer";
}

export interface GalleryStoryblok {
  images?: ImagesStoryblok[];
  layout?: "" | "stack" | "smallTiles" | "largeTiles";
  aspectRatio?: "" | "unset" | "square" | "wide" | "landscape";
  lightbox: boolean;
  _uid: string;
  component: "gallery";
}

export interface GlobalStoryblok {
  global?: (
    | BlogTeaserStoryblok
    | BusinessCardStoryblok
    | ContactStoryblok
    | ContentNavStoryblok
    | CtaStoryblok
    | DividerStoryblok
    | DownloadsStoryblok
    | EventLatestTeaserStoryblok
    | EventListTeaserStoryblok
    | FaqStoryblok
    | FeaturesStoryblok
    | GalleryStoryblok
    | HeadlineStoryblok
    | HeroStoryblok
    | HtmlStoryblok
    | ImageStoryStoryblok
    | ImageTextStoryblok
    | LogosStoryblok
    | MosaicStoryblok
    | SliderStoryblok
    | SplitEvenStoryblok
    | SplitWeightedStoryblok
    | StatsStoryblok
    | TeaserCardStoryblok
    | TestimonialsStoryblok
    | TextStoryblok
    | VideoCurtainStoryblok
    | InfoTableStoryblok
    | PrompterStoryblok
    | TimelineStoryblok
  )[];
  _uid: string;
  component: "global";
  uuid?: string;
}

export interface GlobalReferenceStoryblok {
  reference?: unknown[];
  _uid: string;
  component: "global_reference";
}

export interface HeaderStoryblok {
  logo_src?: AssetStoryblok;
  logo_srcInverted?: AssetStoryblok;
  logo_alt?: string;
  logo_homepageHref?: MultilinkStoryblok;
  logo_width?: string;
  logo_height?: string;
  navItems?: NavItemsStoryblok[];
  _uid: string;
  component: "header";
}

export interface HeadlineStoryblok {
  text?: string;
  sub?: string;
  align?: "" | "left" | "center" | "right";
  style?: "" | "h1" | "h2" | "h3" | "h4" | "p";
  spaceAfter?: "" | "minimum" | "small" | "large";
  _uid: string;
  component: "headline";
}

export interface HeroStoryblok {
  headline?: string;
  sub?: string;
  text?: string;
  mobileTextBelow: boolean;
  invertText: boolean;
  buttons?: ButtonsStoryblok[];
  skipButton: boolean;
  image_srcMobile?: AssetStoryblok;
  image_srcTablet?: AssetStoryblok;
  image_srcDesktop?: AssetStoryblok;
  image_src?: AssetStoryblok;
  image_indent?: "" | "none" | "left" | "right";
  image_alt?: string;
  _uid: string;
  component: "hero";
}

export interface HtmlStoryblok {
  html?: string;
  consent: boolean;
  consentText?: string;
  consentButtonLabel?: string;
  consentBackgroundImage?: AssetStoryblok;
  consentAspectRatio?: "" | "VALUE_16_9" | "VALUE_16_10" | "VALUE_4_3" | "VALUE_1_1";
  _uid: string;
  component: "html";
}

export interface ImagesStoryblok {
  src?: AssetStoryblok;
  alt?: string;
  caption?: string;
  _uid: string;
  component: "images";
}

export interface ImageStoryStoryblok {
  headline?: string;
  sub?: string;
  text?: string;
  layout?: "" | "textLeft" | "imageLeft";
  buttons?: ButtonsStoryblok[];
  image_src?: AssetStoryblok;
  image_aspectRatio?: "" | "unset" | "square" | "wide" | "landscape";
  image_alt?: string;
  image_vAlign?: "" | "center" | "top" | "bottom";
  _uid: string;
  component: "image-story";
}

export interface ImageTextStoryblok {
  text?: string;
  highlightText: boolean;
  image_src?: AssetStoryblok;
  image_alt?: string;
  layout?: "" | "above" | "below" | "beside_right" | "beside_left";
  _uid: string;
  component: "image-text";
}

export interface TableStoryblok {
  thead: {
    _uid: string;
    value?: string;
    component: number;
  }[];
  tbody: {
    _uid: string;
    body: {
      _uid?: string;
      value?: string;
      component?: number;
    }[];
    component: number;
  }[];
}

export interface InfoTableStoryblok {
  data?: TableStoryblok;
  _uid: string;
  component: "info-table";
}

export interface ItemsStoryblok {
  url?: MultilinkStoryblok;
  label?: string;
  active: boolean;
  _uid: string;
  component: "items";
}

export interface LinksStoryblok {
  label?: string;
  url?: MultilinkStoryblok;
  newTab: boolean;
  ariaLabel?: string;
  _uid: string;
  component: "links";
}

export interface LocationsStoryblok {
  dates?: DatesStoryblok[];
  locationName?: string;
  displayMode?: "" | "spacious" | "compact";
  address?: string;
  links?: LinksStoryblok[];
  _uid: string;
  component: "locations";
}

export interface LogoStoryblok {
  src?: AssetStoryblok;
  alt?: string;
  _uid: string;
  component: "logo";
}

export interface LogosStoryblok {
  tagline?: string;
  logo?: LogoStoryblok[];
  logosPerRow?: string;
  cta_toggle: boolean;
  cta_text?: string;
  cta_link?: MultilinkStoryblok;
  cta_label?: string;
  cta_style?: "" | "button" | "text";
  _uid: string;
  component: "logos";
}

export interface MatchesStoryblok {
  title?: string;
  snippet?: string;
  url?: string;
  _uid: string;
  component: "matches";
}

export interface MosaicStoryblok {
  layout?: "" | "alternate" | "textLeft" | "textRight";
  largeHeadlines: boolean;
  tile?: TileStoryblok[];
  _uid: string;
  component: "mosaic";
}

export interface NavItemsStoryblok {
  url?: MultilinkStoryblok;
  label?: string;
  active: boolean;
  items?: ItemsStoryblok[];
  _uid: string;
  component: "navItems";
}

export interface PageStoryblok {
  section?: SectionStoryblok[];
  header_floating: boolean;
  header_inverted: boolean;
  header_logo?: AssetStoryblok;
  footer_inverted: boolean;
  footer_logo?: AssetStoryblok;
  token?: string;
  hidePageBreadcrumbs: boolean;
  seo?: SeoStoryblok[];
  _uid: string;
  component: "page";
  uuid?: string;
}

export interface PrompterStoryblok {
  mode?: "" | "section" | "page";
  componentTypes?: ComponentTypesStoryblok[];
  sections?: string;
  includeStory: boolean;
  useIdea: boolean;
  relatedStories?: RelatedStoriesStoryblok[];
  userPrompt?: string;
  systemPrompt?: string;
  contentType?: "" | "page" | "blog_post" | "blog_overview";
  startsWith?: string;
  uploadAssets: boolean;
  _uid: string;
  component: "prompter";
}

export interface QuestionsStoryblok {
  question?: string;
  answer?: string;
  _uid: string;
  component: "questions";
}

export interface RelatedStoriesStoryblok {
  entry?: string;
  _uid: string;
  component: "relatedStories";
}

export interface SearchStoryblok {
  headline?: HeadlineStoryblok[];
  searchBar?: SearchBarStoryblok[];
  searchFilter?: SearchFilterStoryblok[];
  searchResults?: SearchResultsStoryblok[];
  _uid: string;
  component: "search";
}

export interface SearchBarStoryblok {
  placeholder?: string;
  buttonText?: string;
  hint?: string;
  alternativeText?: string;
  alternativeResult?: string;
  _uid: string;
  component: "search-bar";
}

export interface SearchFilterStoryblok {
  title?: string;
  categories?: CategoriesStoryblok[];
  _uid: string;
  component: "search-filter";
}

export interface SearchResultsStoryblok {
  url?: string;
  title?: string;
  imageColSize?: "" | "none" | "small" | "large";
  previewImage?: string;
  initialMatch?: string;
  matches?: MatchesStoryblok[];
  showLink: boolean;
  _uid: string;
  component: "searchResults";
}

export interface SectionStoryblok {
  width?: "" | "full" | "max" | "wide" | "default" | "narrow";
  style?: "" | "default" | "framed" | "deko";
  backgroundColor?: "" | "default" | "accent" | "bold";
  transition?: "" | "none" | "to_default" | "to_accent" | "to_bold" | "to_inverted";
  inverted: boolean;
  headline_text?: string;
  headline_large: boolean;
  headline_width?: "" | "unset" | "narrow" | "default" | "wide";
  headline_textAlign?: "" | "left" | "center" | "right";
  headline_align?: "" | "left" | "center" | "right";
  headline_sub?: string;
  headline_switchOrder: boolean;
  content_width?: "" | "unset" | "narrow" | "default" | "wide";
  content_align?: "" | "left" | "center" | "right";
  content_gutter?: "" | "large" | "default" | "small" | "none";
  content_mode?: "" | "default" | "tile" | "list" | "slider";
  content_tileWidth?: "" | "smallest" | "default" | "medium" | "large" | "largest" | "full";
  components?: (
    | BlogTeaserStoryblok
    | BusinessCardStoryblok
    | ContactStoryblok
    | ContentNavStoryblok
    | CtaStoryblok
    | DividerStoryblok
    | DownloadsStoryblok
    | EventLatestTeaserStoryblok
    | EventListTeaserStoryblok
    | FaqStoryblok
    | FeaturesStoryblok
    | GalleryStoryblok
    | HeadlineStoryblok
    | HeroStoryblok
    | HtmlStoryblok
    | ImageStoryStoryblok
    | ImageTextStoryblok
    | LogosStoryblok
    | MosaicStoryblok
    | SliderStoryblok
    | SplitEvenStoryblok
    | SplitWeightedStoryblok
    | StatsStoryblok
    | TeaserCardStoryblok
    | TestimonialsStoryblok
    | TextStoryblok
    | VideoCurtainStoryblok
    | InfoTableStoryblok
    | PrompterStoryblok
    | TimelineStoryblok
    | GlobalReferenceStoryblok
  )[];
  buttons?: ButtonsStoryblok[];
  aiDraft: boolean;
  _uid: string;
  component: "section";
}

export interface SeoStoryblok {
  title?: string;
  description?: string;
  keywords?: string;
  image?: AssetStoryblok;
  _uid: string;
  component: "seo";
}

export interface SettingsStoryblok {
  header?: HeaderStoryblok[];
  footer?: FooterStoryblok[];
  seo?: SeoStoryblok[];
  iconSprite?: string;
  token?: string;
  hideBreadcrumbs: boolean;
  _uid: string;
  component: "settings";
}

export interface SliderStoryblok {
  autoplay: boolean;
  nav: boolean;
  teaseNeighbours: boolean;
  equalHeight: boolean;
  arrows: boolean;
  variant?: "" | "slider" | "carousel";
  _uid: string;
  component: "slider";
}

export interface SocialSharingStoryblok {
  url?: MultilinkStoryblok;
  title?: string;
  _uid: string;
  component: "socialSharing";
}

export interface SplitEvenStoryblok {
  contentMinWidth?: "" | "narrow" | "medium" | "wide";
  contentGutter?: "" | "small" | "default" | "large" | "none";
  mobileReverse: boolean;
  verticalAlign?: "" | "top" | "center" | "bottom" | "sticky";
  verticalGutter?: "" | "large" | "default" | "small" | "none";
  horizontalGutter?: "" | "large" | "default" | "small" | "none";
  firstLayout_layout?: "" | "smallTiles" | "largeTiles" | "list";
  firstLayout_gutter?: "" | "none" | "small" | "default" | "large";
  firstLayout_stretchVertically: boolean;
  secondLayout_layout?: "" | "smallTiles" | "largeTiles" | "list";
  secondLayout_stretchVertically: boolean;
  secondLayout_gutter?: "" | "none" | "small" | "default" | "large";
  firstComponents?: (
    | BlogTeaserStoryblok
    | BusinessCardStoryblok
    | Tab6Ab844812Df54AdeB9C9273160753B21Storyblok
    | ContactStoryblok
    | ContentNavStoryblok
    | CtaStoryblok
    | DividerStoryblok
    | DownloadsStoryblok
    | EventLatestTeaserStoryblok
    | EventListTeaserStoryblok
    | FaqStoryblok
    | FeaturesStoryblok
    | GalleryStoryblok
    | HeadlineStoryblok
    | HeroStoryblok
    | HtmlStoryblok
    | ImageStoryStoryblok
    | ImageTextStoryblok
    | LogosStoryblok
    | MosaicStoryblok
    | SliderStoryblok
    | StatsStoryblok
    | TeaserCardStoryblok
    | TestimonialsStoryblok
    | TextStoryblok
    | VideoCurtainStoryblok
    | Tab35C46Ef3440A4BafA832Ca0Ff08Fa47BStoryblok
  )[];
  secondComponents?: (
    | BlogTeaserStoryblok
    | BusinessCardStoryblok
    | ContactStoryblok
    | ContentNavStoryblok
    | CtaStoryblok
    | DividerStoryblok
    | DownloadsStoryblok
    | EventLatestTeaserStoryblok
    | EventListTeaserStoryblok
    | FaqStoryblok
    | FeaturesStoryblok
    | GalleryStoryblok
    | HeroStoryblok
    | HtmlStoryblok
    | ImageStoryStoryblok
    | ImageTextStoryblok
    | LogosStoryblok
    | MosaicStoryblok
    | SliderStoryblok
    | StatsStoryblok
    | TeaserCardStoryblok
    | TestimonialsStoryblok
    | TextStoryblok
    | VideoCurtainStoryblok
  )[];
  _uid: string;
  component: "split-even";
}

export interface SplitWeightedStoryblok {
  verticalGutter?: "" | "large" | "default" | "small" | "none";
  horizontalGutter?: "" | "large" | "default" | "small" | "none";
  verticalAlign?: "" | "top" | "center" | "bottom" | "sticky";
  mainLayout_gutter?: "" | "large" | "default" | "small" | "none";
  mainLayout_minWidth?: "" | "narrow" | "default" | "wide";
  mainLayout_stretchVertically: boolean;
  mainLayout_layout?: "" | "smallTiles" | "largeTiles" | "list";
  asideLayout_gutter?: "" | "large" | "default" | "small" | "none";
  asideLayout_minWidth?: "" | "narrow" | "default" | "wide";
  asideLayout_stretchVertically: boolean;
  asideLayout_layout?: "" | "smallTiles" | "largeTiles" | "list";
  order_mobile?: "" | "mainFirst" | "asideFirst";
  order_desktop?: "" | "mainFirst" | "asideFirst";
  mainComponents?: (
    | BlogTeaserStoryblok
    | BusinessCardStoryblok
    | ContactStoryblok
    | ContentNavStoryblok
    | CtaStoryblok
    | DividerStoryblok
    | DownloadsStoryblok
    | EventLatestTeaserStoryblok
    | EventListTeaserStoryblok
    | FaqStoryblok
    | FeaturesStoryblok
    | GalleryStoryblok
    | HeroStoryblok
    | HtmlStoryblok
    | ImageStoryStoryblok
    | ImageTextStoryblok
    | LogosStoryblok
    | MosaicStoryblok
    | SliderStoryblok
    | StatsStoryblok
    | TeaserCardStoryblok
    | TestimonialsStoryblok
    | TextStoryblok
    | VideoCurtainStoryblok
  )[];
  asideComponents?: (
    | BlogTeaserStoryblok
    | BusinessCardStoryblok
    | Tab40Ed3E53Cb7A4Ea3B4548Bf5695Be436Storyblok
    | ContactStoryblok
    | ContentNavStoryblok
    | CtaStoryblok
    | DividerStoryblok
    | DownloadsStoryblok
    | EventLatestTeaserStoryblok
    | EventListTeaserStoryblok
    | FaqStoryblok
    | FeaturesStoryblok
    | GalleryStoryblok
    | HeadlineStoryblok
    | HeroStoryblok
    | HtmlStoryblok
    | ImageStoryStoryblok
    | ImageTextStoryblok
    | LogosStoryblok
    | MosaicStoryblok
    | SliderStoryblok
    | StatsStoryblok
    | TeaserCardStoryblok
    | TestimonialsStoryblok
    | TextStoryblok
    | VideoCurtainStoryblok
    | Tab86294Cac49C04992BafbAc67Bfc0560AStoryblok
  )[];
  _uid: string;
  component: "split-weighted";
}

export interface StatStoryblok {
  number?: string;
  description?: string;
  title?: string;
  _uid: string;
  component: "stat";
}

export interface StatsStoryblok {
  align?: "" | "left" | "center";
  stat?: StatStoryblok[];
  _uid: string;
  component: "stats";
}

export interface Tab35C46Ef3440A4BafA832Ca0Ff08Fa47BStoryblok {
  button_label?: string;
  button_url?: MultilinkStoryblok;
  button_variant?: "" | "primary" | "secondary" | "tertiary";
  button_size?: "" | "small" | "medium" | "large";
  button_type?: "" | "button" | "submit" | "reset";
  _uid: string;
  component: "tab-35c46ef3-440a-4baf-a832-ca0ff08fa47b";
}

export interface Tab3Fe1526BD5F9458F9B7C44B26C923B60Storyblok {
  button_label?: string;
  button_url?: MultilinkStoryblok;
  button_variant?: "" | "primary" | "secondary" | "tertiary";
  button_size?: "" | "small" | "medium" | "large";
  button_disabled: boolean;
  button_type?: "" | "button" | "submit" | "reset";
  _uid: string;
  component: "tab-3fe1526b-d5f9-458f-9b7c-44b26c923b60";
}

export interface Tab40Ed3E53Cb7A4Ea3B4548Bf5695Be436Storyblok {
  button_label?: string;
  button_url?: MultilinkStoryblok;
  button_variant?: "" | "primary" | "secondary" | "tertiary";
  button_size?: "" | "small" | "medium" | "large";
  button_disabled: boolean;
  button_type?: "" | "button" | "submit" | "reset";
  _uid: string;
  component: "tab-40ed3e53-cb7a-4ea3-b454-8bf5695be436";
}

export interface Tab6Ab844812Df54AdeB9C9273160753B21Storyblok {
  button_label?: string;
  button_url?: MultilinkStoryblok;
  button_variant?: "" | "primary" | "secondary" | "tertiary";
  button_size?: "" | "small" | "medium" | "large";
  button_disabled: boolean;
  button_type?: "" | "button" | "submit" | "reset";
  _uid: string;
  component: "tab-6ab84481-2df5-4ade-b9c9-273160753b21";
}

export interface Tab7Ebe4Bd724Ba43C2A543Ee390B707137Storyblok {
  button_label?: string;
  button_url?: MultilinkStoryblok;
  button_variant?: "" | "primary" | "secondary" | "tertiary";
  button_size?: "" | "small" | "medium" | "large";
  button_type?: "" | "button" | "submit" | "reset";
  _uid: string;
  component: "tab-7ebe4bd7-24ba-43c2-a543-ee390b707137";
}

export interface Tab7F9211364Ca94925Bf95241F5Efe9315Storyblok {
  button_label?: string;
  button_url?: MultilinkStoryblok;
  button_variant?: "" | "primary" | "secondary" | "tertiary";
  button_size?: "" | "small" | "medium" | "large";
  button_type?: "" | "button" | "submit" | "reset";
  _uid: string;
  component: "tab-7f921136-4ca9-4925-bf95-241f5efe9315";
}

export interface Tab86294Cac49C04992BafbAc67Bfc0560AStoryblok {
  button_label?: string;
  button_url?: MultilinkStoryblok;
  button_variant?: "" | "primary" | "secondary" | "tertiary";
  button_size?: "" | "small" | "medium" | "large";
  button_type?: "" | "button" | "submit" | "reset";
  _uid: string;
  component: "tab-86294cac-49c0-4992-bafb-ac67bfc0560a";
}

export interface Tab8Beb9150B104432CA96DDd697Dfae6F6Storyblok {
  button_label?: string;
  button_url?: MultilinkStoryblok;
  button_variant?: "" | "primary" | "secondary" | "tertiary";
  button_size?: "" | "small" | "medium" | "large";
  button_disabled: boolean;
  button_type?: "" | "button" | "submit" | "reset";
  _uid: string;
  component: "tab-8beb9150-b104-432c-a96d-dd697dfae6f6";
}

export interface TabA2F64Ae9E44D484BA28B15D440F64E6FStoryblok {
  button_label?: string;
  button_url?: MultilinkStoryblok;
  button_variant?: "" | "primary" | "secondary" | "tertiary";
  button_size?: "" | "small" | "medium" | "large";
  button_disabled: boolean;
  button_type?: "" | "button" | "submit" | "reset";
  _uid: string;
  component: "tab-a2f64ae9-e44d-484b-a28b-15d440f64e6f";
}

export interface TabAacb7C04Ca1F4B89B9Ae62Db315566CeStoryblok {
  button_label?: string;
  button_url?: MultilinkStoryblok;
  button_variant?: "" | "primary" | "secondary" | "tertiary";
  button_size?: "" | "small" | "medium" | "large";
  button_disabled: boolean;
  button_type?: "" | "button" | "submit" | "reset";
  _uid: string;
  component: "tab-aacb7c04-ca1f-4b89-b9ae-62db315566ce";
}

export interface TabC89Ca26198E14F258Ef557Eec1041C75Storyblok {
  button_label?: string;
  button_url?: MultilinkStoryblok;
  button_variant?: "" | "primary" | "secondary" | "tertiary";
  button_size?: "" | "small" | "medium" | "large";
  button_type?: "" | "button" | "submit" | "reset";
  _uid: string;
  component: "tab-c89ca261-98e1-4f25-8ef5-57eec1041c75";
}

export interface TabE3Fe2141569F4550A8Af2Ae44E02Ba26Storyblok {
  button_label?: string;
  button_url?: MultilinkStoryblok;
  button_variant?: "" | "primary" | "secondary" | "tertiary";
  button_size?: "" | "small" | "medium" | "large";
  button_type?: "" | "button" | "submit" | "reset";
  _uid: string;
  component: "tab-e3fe2141-569f-4550-a8af-2ae44e02ba26";
}

export interface TagsStoryblok {
  entry?: string;
  _uid: string;
  component: "tags";
}

export interface TeaserCardStoryblok {
  headline?: string;
  text?: string;
  label?: string;
  layout?: "" | "stack" | "row" | "compact";
  centered: boolean;
  url?: MultilinkStoryblok;
  button_label?: string;
  button_chevron: boolean;
  button_hidden: boolean;
  image?: AssetStoryblok;
  imageAlt?: string;
  imageRatio?: "" | "wide" | "landscape" | "square" | "unset";
  _uid: string;
  component: "teaser-card";
}

export interface TestimonialStoryblok {
  quote?: string;
  name?: string;
  title?: string;
  image_src?: AssetStoryblok;
  image_alt?: string;
  rating?: string;
  _uid: string;
  component: "testimonial";
}

export interface TestimonialsStoryblok {
  layout?: "" | "slider" | "list" | "alternating";
  quoteSigns?: "" | "normal" | "large" | "none";
  testimonial?: TestimonialStoryblok[];
  _uid: string;
  component: "testimonials";
}

export interface TextStoryblok {
  text?: string;
  layout?: "" | "singleColumn" | "multiColumn";
  highlightText: boolean;
  _uid: string;
  component: "text";
}

export interface TileStoryblok {
  headline?: string;
  sub?: string;
  text?: string;
  image_src?: AssetStoryblok;
  image_alt?: string;
  button_toggle: boolean;
  button_label?: string;
  button_url?: MultilinkStoryblok;
  backgroundColor?: string;
  backgroundImage?: AssetStoryblok;
  _uid: string;
  component: "tile";
}

export interface TimelineStoryblok {
  timelineItems?: TimelineItemsStoryblok[];
  _uid: string;
  component: "timeline";
}

export interface TimelineItemsStoryblok {
  year?: string;
  textLeft?: string;
  textRight?: string;
  image_src?: AssetStoryblok;
  image_alt?: string;
  _uid: string;
  component: "timelineItems";
}

export interface TokenThemeStoryblok {
  name: string;
  tokens?: string;
  css?: string;
  _uid: string;
  component: "token-theme";
}

export interface VideoCurtainStoryblok {
  headline?: string;
  sub?: string;
  text?: string;
  highlightText: boolean;
  colorNeutral: boolean;
  buttons?: ButtonsStoryblok[];
  overlay: boolean;
  video_srcMobile?: AssetStoryblok;
  video_srcTablet?: AssetStoryblok;
  video_srcDesktop?: AssetStoryblok;
  textPosition?: "" | "center" | "bottom" | "left" | "right" | "corner";
  _uid: string;
  component: "video-curtain";
}
