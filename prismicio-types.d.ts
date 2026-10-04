import type * as prismic from "@prismicio/client";

type Simplify<T> = { [KeyType in keyof T]: T[KeyType] };


type PickContentRelationshipFieldData<
	TRelationship extends prismic.CustomTypeModelFetchCustomTypeLevel1 | prismic.CustomTypeModelFetchCustomTypeLevel2 | prismic.CustomTypeModelFetchGroupLevel1 | prismic.CustomTypeModelFetchGroupLevel2,
	TData extends Record<string, prismic.AnyRegularField | prismic.GroupField | prismic.NestedGroupField | prismic.SliceZone>,
	TLang extends string
> = |
	// Content relationship fields
	{
		[TSubRelationship in Extract<
			TRelationship["fields"][number], prismic.CustomTypeModelFetchContentRelationshipLevel1
		> as TSubRelationship["id"]]:
			ContentRelationshipFieldWithData<TSubRelationship["customtypes"], TLang>;
	} &
	// Group
	{
		[TGroup in Extract<
			TRelationship["fields"][number], prismic.CustomTypeModelFetchGroupLevel1 | prismic.CustomTypeModelFetchGroupLevel2
		> as TGroup["id"]]:
			TData[TGroup["id"]] extends prismic.GroupField<infer TGroupData>
				? prismic.GroupField<PickContentRelationshipFieldData<TGroup, TGroupData, TLang>>
				: never
	} &
	// Other fields
	{
		[TFieldKey in Extract<TRelationship["fields"][number], string>]:
			TFieldKey extends keyof TData ? TData[TFieldKey] : never;
	};

type ContentRelationshipFieldWithData<
	TCustomType extends readonly (prismic.CustomTypeModelFetchCustomTypeLevel1 | string)[] | readonly (prismic.CustomTypeModelFetchCustomTypeLevel2 | string)[],
	TLang extends string = string
> = {
	[ID in Exclude<TCustomType[number], string>["id"]]:
		prismic.ContentRelationshipField<
			ID,
			TLang,
			PickContentRelationshipFieldData<
				Extract<TCustomType[number], { id: ID }>,
				Extract<prismic.Content.AllDocumentTypes, { type: ID }>["data"],
				TLang
			>
		>
}[Exclude<TCustomType[number], string>["id"]];

/**
 * Item in *form replies → replies*
 */
export interface FormRepliesDocumentDataRepliesItem {
	/**
	 * form field in *form replies → replies*
	 *
	 * - **Field Type**: Select
	 * - **Placeholder**: Pick the form this reply answers — one row per form
	 * - **API ID Path**: form_replies.replies[].form_type
	 * - **Documentation**: https://prismic.io/docs/fields/select
	 */
	form_type: prismic.SelectField<"contact" | "inquiry" | "newsletter" | "rsvp" | "reserve">;
	
	/**
	 * subject field in *form replies → replies*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: Subject line of the email the visitor receives
	 * - **API ID Path**: form_replies.replies[].subject
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	subject: prismic.KeyTextField;
	
	/**
	 * body field in *form replies → replies*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: What the visitor reads. Bold, italic, links and lists are sent; other formatting is not.
	 * - **API ID Path**: form_replies.replies[].body
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	body: prismic.RichTextField;
}

/**
 * Content for form replies documents
 */
interface FormRepliesDocumentData {
	/**
	 * replies field in *form replies*
	 *
	 * - **Field Type**: Group
	 * - **Placeholder**: *None*
	 * - **API ID Path**: form_replies.replies[]
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/fields/repeatable-group
	 */
	replies: prismic.GroupField<Simplify<FormRepliesDocumentDataRepliesItem>>;
	
	/**
	 * signature field in *form replies*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: Sign-off appended to every reply, whatever the form
	 * - **API ID Path**: form_replies.signature
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	signature: prismic.RichTextField;
}

/**
 * form replies document from Prismic
 *
 * - **API ID**: `form_replies`
 * - **Repeatable**: `false`
 * - **Documentation**: https://prismic.io/docs/content-modeling
 *
 * @typeParam Lang - Language API ID of the document.
 */
export type FormRepliesDocument<Lang extends string = string> = prismic.PrismicDocumentWithoutUID<Simplify<FormRepliesDocumentData>, "form_replies", Lang>;

type PageDocumentDataSlicesSlice = LeadTextSlice | TextColumnsSlice | AccordionSlice | RichTextSlice | HeroSlice | MediaTextSlice | SectionGridSlice | TestimonialSlice | CtaBannerSlice | NavyHeroSliderSlice | NavyLocationBandSlice | NavyFloorPlansSlice | NavyResidentLinksSlice | NavyContactSlice

/**
 * Content for Page documents
 */
interface PageDocumentData {
	/**
	 * Title field in *Page*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: page.title
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	title: prismic.RichTextField;
	
	/**
	 * Slice Zone field in *Page*
	 *
	 * - **Field Type**: Slice Zone
	 * - **Placeholder**: *None*
	 * - **API ID Path**: page.slices[]
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/slices
	 */
	slices: prismic.SliceZone<PageDocumentDataSlicesSlice>;/**
	 * Meta Title field in *Page*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: A title of the page used for social media and search engines
	 * - **API ID Path**: page.meta_title
	 * - **Tab**: SEO & Metadata
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	meta_title: prismic.KeyTextField;
	
	/**
	 * Meta Description field in *Page*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: A brief summary of the page
	 * - **API ID Path**: page.meta_description
	 * - **Tab**: SEO & Metadata
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	meta_description: prismic.KeyTextField;
	
	/**
	 * Meta Image field in *Page*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: page.meta_image
	 * - **Tab**: SEO & Metadata
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	meta_image: prismic.ImageField<never>;
}

/**
 * Page document from Prismic
 *
 * - **API ID**: `page`
 * - **Repeatable**: `true`
 * - **Documentation**: https://prismic.io/docs/content-modeling
 *
 * @typeParam Lang - Language API ID of the document.
 */
export type PageDocument<Lang extends string = string> = prismic.PrismicDocumentWithUID<Simplify<PageDocumentData>, "page", Lang>;

export type AllDocumentTypes = FormRepliesDocument | PageDocument;

/**
 * Item in *Accordion → Default → Primary → items*
 */
export interface AccordionSliceDefaultPrimaryItemsItem {
	/**
	 * title field in *Accordion → Default → Primary → items*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. About the project
	 * - **API ID Path**: accordion.default.primary.items[].title
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	title: prismic.KeyTextField;
	
	/**
	 * body field in *Accordion → Default → Primary → items*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: accordion.default.primary.items[].body
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	body: prismic.KeyTextField;
}

/**
 * Primary content in *Accordion → Default → Primary*
 */
export interface AccordionSliceDefaultPrimary {
	/**
	 * items field in *Accordion → Default → Primary*
	 *
	 * - **Field Type**: Group
	 * - **Placeholder**: *None*
	 * - **API ID Path**: accordion.default.primary.items[]
	 * - **Documentation**: https://prismic.io/docs/fields/repeatable-group
	 */
	items: prismic.GroupField<Simplify<AccordionSliceDefaultPrimaryItemsItem>>;
	
	/**
	 * allowMultiple field in *Accordion → Default → Primary*
	 *
	 * - **Field Type**: Boolean
	 * - **Placeholder**: *None*
	 * - **Default Value**: true
	 * - **API ID Path**: accordion.default.primary.allowMultiple
	 * - **Documentation**: https://prismic.io/docs/fields/boolean
	 */
	allowMultiple: prismic.BooleanField;
}

/**
 * Default variation for Accordion Slice
 *
 * - **API ID**: `default`
 * - **Description**: A list of collapsible disclosure items
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type AccordionSliceDefault = prismic.SharedSliceVariation<"default", Simplify<AccordionSliceDefaultPrimary>, never>;

/**
 * Slice variation for *Accordion*
 */
type AccordionSliceVariation = AccordionSliceDefault

/**
 * Accordion Shared Slice
 *
 * - **API ID**: `accordion`
 * - **Description**: Accordion
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type AccordionSlice = prismic.SharedSlice<"accordion", AccordionSliceVariation>;

/**
 * Primary content in *CtaBanner → Default → Primary*
 */
export interface CtaBannerSliceDefaultPrimary {
	/**
	 * heading field in *CtaBanner → Default → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: e.g. Ready to start your project?
	 * - **API ID Path**: cta_banner.default.primary.heading
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	heading: prismic.RichTextField;
	
	/**
	 * buttonLabel field in *CtaBanner → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. Talk with us
	 * - **API ID Path**: cta_banner.default.primary.buttonLabel
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	buttonLabel: prismic.KeyTextField;
	
	/**
	 * buttonLink field in *CtaBanner → Default → Primary*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: cta_banner.default.primary.buttonLink
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	buttonLink: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
	
	/**
	 * background (theme token) field in *CtaBanner → Default → Primary*
	 *
	 * - **Field Type**: Select
	 * - **Placeholder**: *None*
	 * - **Default Value**: light
	 * - **API ID Path**: cta_banner.default.primary.background
	 * - **Documentation**: https://prismic.io/docs/fields/select
	 */
	background: prismic.SelectField<"light" | "dark" | "white", "filled">;
}

/**
 * Default variation for CtaBanner Slice
 *
 * - **API ID**: `default`
 * - **Description**: Full-bleed band with a headline and one call-to-action link
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type CtaBannerSliceDefault = prismic.SharedSliceVariation<"default", Simplify<CtaBannerSliceDefaultPrimary>, never>;

/**
 * Slice variation for *CtaBanner*
 */
type CtaBannerSliceVariation = CtaBannerSliceDefault

/**
 * CtaBanner Shared Slice
 *
 * - **API ID**: `cta_banner`
 * - **Description**: CtaBanner
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type CtaBannerSlice = prismic.SharedSlice<"cta_banner", CtaBannerSliceVariation>;

/**
 * Primary content in *Hero → Default → Primary*
 */
export interface HeroSliceDefaultPrimary {
	/**
	 * heading field in *Hero → Default → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: hero.default.primary.heading
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	heading: prismic.RichTextField;
	
	/**
	 * body field in *Hero → Default → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: hero.default.primary.body
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	body: prismic.RichTextField;
	
	/**
	 * background_image field in *Hero → Default → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: hero.default.primary.background_image
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	background_image: prismic.ImageField<never>;
	
	/**
	 * cta_label field in *Hero → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: hero.default.primary.cta_label
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	cta_label: prismic.KeyTextField;
	
	/**
	 * cta_link field in *Hero → Default → Primary*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: hero.default.primary.cta_link
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	cta_link: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
}

/**
 * Default variation for Hero Slice
 *
 * - **API ID**: `default`
 * - **Description**: Background image with heading, body, and CTA
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type HeroSliceDefault = prismic.SharedSliceVariation<"default", Simplify<HeroSliceDefaultPrimary>, never>;

/**
 * Slice variation for *Hero*
 */
type HeroSliceVariation = HeroSliceDefault

/**
 * Hero Shared Slice
 *
 * - **API ID**: `hero`
 * - **Description**: Full-bleed hero with background media and heading/CTA
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type HeroSlice = prismic.SharedSlice<"hero", HeroSliceVariation>;

/**
 * Primary content in *LeadText → Default → Primary*
 */
export interface LeadTextSliceDefaultPrimary {
	/**
	 * eyebrow field in *LeadText → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. The Challenge
	 * - **API ID Path**: lead_text.default.primary.eyebrow
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	eyebrow: prismic.KeyTextField;
	
	/**
	 * body field in *LeadText → Default → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: lead_text.default.primary.body
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	body: prismic.RichTextField;
}

/**
 * Default variation for LeadText Slice
 *
 * - **API ID**: `default`
 * - **Description**: An eyebrow label above a lead paragraph
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type LeadTextSliceDefault = prismic.SharedSliceVariation<"default", Simplify<LeadTextSliceDefaultPrimary>, never>;

/**
 * Slice variation for *LeadText*
 */
type LeadTextSliceVariation = LeadTextSliceDefault

/**
 * LeadText Shared Slice
 *
 * - **API ID**: `lead_text`
 * - **Description**: LeadText
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type LeadTextSlice = prismic.SharedSlice<"lead_text", LeadTextSliceVariation>;

/**
 * Primary content in *MediaText → Image Right → Primary*
 */
export interface MediaTextSliceImageRightPrimary {
	/**
	 * heading field in *MediaText → Image Right → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: media_text.imageRight.primary.heading
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	heading: prismic.RichTextField;
	
	/**
	 * body field in *MediaText → Image Right → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: media_text.imageRight.primary.body
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	body: prismic.RichTextField;
	
	/**
	 * media field in *MediaText → Image Right → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: media_text.imageRight.primary.media
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	media: prismic.ImageField<never>;
}

/**
 * Image Right variation for MediaText Slice
 *
 * - **API ID**: `imageRight`
 * - **Description**: Media on the right, text on the left
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type MediaTextSliceImageRight = prismic.SharedSliceVariation<"imageRight", Simplify<MediaTextSliceImageRightPrimary>, never>;

/**
 * Primary content in *MediaText → Image Left → Primary*
 */
export interface MediaTextSliceImageLeftPrimary {
	/**
	 * heading field in *MediaText → Image Left → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: media_text.imageLeft.primary.heading
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	heading: prismic.RichTextField;
	
	/**
	 * body field in *MediaText → Image Left → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: media_text.imageLeft.primary.body
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	body: prismic.RichTextField;
	
	/**
	 * media field in *MediaText → Image Left → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: media_text.imageLeft.primary.media
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	media: prismic.ImageField<never>;
}

/**
 * Image Left variation for MediaText Slice
 *
 * - **API ID**: `imageLeft`
 * - **Description**: Media on the left, text on the right
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type MediaTextSliceImageLeft = prismic.SharedSliceVariation<"imageLeft", Simplify<MediaTextSliceImageLeftPrimary>, never>;

/**
 * Slice variation for *MediaText*
 */
type MediaTextSliceVariation = MediaTextSliceImageRight | MediaTextSliceImageLeft

/**
 * MediaText Shared Slice
 *
 * - **API ID**: `media_text`
 * - **Description**: Image/video beside rich text
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type MediaTextSlice = prismic.SharedSlice<"media_text", MediaTextSliceVariation>;

/**
 * Item in *NavyContact → Default → Primary → links*
 */
export interface NavyContactSliceDefaultPrimaryLinksItem {
	/**
	 * label field in *NavyContact → Default → Primary → links*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. Call us:
	 * - **API ID Path**: navy_contact.default.primary.links[].label
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	label: prismic.KeyTextField;
	
	/**
	 * value field in *NavyContact → Default → Primary → links*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. (310) 393-9657
	 * - **API ID Path**: navy_contact.default.primary.links[].value
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	value: prismic.KeyTextField;
	
	/**
	 * target field in *NavyContact → Default → Primary → links*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_contact.default.primary.links[].target
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	target: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
}

/**
 * Primary content in *NavyContact → Default → Primary*
 */
export interface NavyContactSliceDefaultPrimary {
	/**
	 * heading field in *NavyContact → Default → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_contact.default.primary.heading
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	heading: prismic.RichTextField;
	
	/**
	 * address_line_1 field in *NavyContact → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. 29 Navy Street
	 * - **API ID Path**: navy_contact.default.primary.address_line_1
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	address_line_1: prismic.KeyTextField;
	
	/**
	 * address_line_2 field in *NavyContact → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. Venice, California 90291
	 * - **API ID Path**: navy_contact.default.primary.address_line_2
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	address_line_2: prismic.KeyTextField;
	
	/**
	 * links field in *NavyContact → Default → Primary*
	 *
	 * - **Field Type**: Group
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_contact.default.primary.links[]
	 * - **Documentation**: https://prismic.io/docs/fields/repeatable-group
	 */
	links: prismic.GroupField<Simplify<NavyContactSliceDefaultPrimaryLinksItem>>;
	
	/**
	 * photo field in *NavyContact → Default → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_contact.default.primary.photo
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	photo: prismic.ImageField<never>;
}

/**
 * Default variation for NavyContact Slice
 *
 * - **API ID**: `default`
 * - **Description**: Address and contact links on a black panel, with a full-bleed photograph beside it
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type NavyContactSliceDefault = prismic.SharedSliceVariation<"default", Simplify<NavyContactSliceDefaultPrimary>, never>;

/**
 * Slice variation for *NavyContact*
 */
type NavyContactSliceVariation = NavyContactSliceDefault

/**
 * NavyContact Shared Slice
 *
 * - **API ID**: `navy_contact`
 * - **Description**: Black contact panel beside a full-bleed photo
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type NavyContactSlice = prismic.SharedSlice<"navy_contact", NavyContactSliceVariation>;

/**
 * Item in *NavyFloorPlans → Default → Primary → floors*
 */
export interface NavyFloorPlansSliceDefaultPrimaryFloorsItem {
	/**
	 * label field in *NavyFloorPlans → Default → Primary → floors*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. 4th Floor - Penthouse
	 * - **API ID Path**: navy_floor_plans.default.primary.floors[].label
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	label: prismic.KeyTextField;
	
	/**
	 * trigger_image field in *NavyFloorPlans → Default → Primary → floors*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_floor_plans.default.primary.floors[].trigger_image
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	trigger_image: prismic.ImageField<never>;
	
	/**
	 * floorplan field in *NavyFloorPlans → Default → Primary → floors*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_floor_plans.default.primary.floors[].floorplan
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	floorplan: prismic.ImageField<never>;
	
	/**
	 * pdf field in *NavyFloorPlans → Default → Primary → floors*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_floor_plans.default.primary.floors[].pdf
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	pdf: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
	
	/**
	 * open_by_default field in *NavyFloorPlans → Default → Primary → floors*
	 *
	 * - **Field Type**: Boolean
	 * - **Placeholder**: *None*
	 * - **Default Value**: false
	 * - **API ID Path**: navy_floor_plans.default.primary.floors[].open_by_default
	 * - **Documentation**: https://prismic.io/docs/fields/boolean
	 */
	open_by_default: prismic.BooleanField;
}

/**
 * Primary content in *NavyFloorPlans → Default → Primary*
 */
export interface NavyFloorPlansSliceDefaultPrimary {
	/**
	 * title field in *NavyFloorPlans → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. Lofts
	 * - **API ID Path**: navy_floor_plans.default.primary.title
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	title: prismic.KeyTextField;
	
	/**
	 * intro field in *NavyFloorPlans → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. Hover or click on a floor
	 * - **API ID Path**: navy_floor_plans.default.primary.intro
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	intro: prismic.KeyTextField;
	
	/**
	 * pdf_label field in *NavyFloorPlans → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. Download a PDF of this floor
	 * - **API ID Path**: navy_floor_plans.default.primary.pdf_label
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	pdf_label: prismic.KeyTextField;
	
	/**
	 * floors field in *NavyFloorPlans → Default → Primary*
	 *
	 * - **Field Type**: Group
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_floor_plans.default.primary.floors[]
	 * - **Documentation**: https://prismic.io/docs/fields/repeatable-group
	 */
	floors: prismic.GroupField<Simplify<NavyFloorPlansSliceDefaultPrimaryFloorsItem>>;
}

/**
 * Default variation for NavyFloorPlans Slice
 *
 * - **API ID**: `default`
 * - **Description**: Four floor triggers in a left column, with one floor plan panel open beside them
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type NavyFloorPlansSliceDefault = prismic.SharedSliceVariation<"default", Simplify<NavyFloorPlansSliceDefaultPrimary>, never>;

/**
 * Slice variation for *NavyFloorPlans*
 */
type NavyFloorPlansSliceVariation = NavyFloorPlansSliceDefault

/**
 * NavyFloorPlans Shared Slice
 *
 * - **API ID**: `navy_floor_plans`
 * - **Description**: Floor-plan panel switcher — a column of floor triggers beside one open floor panel
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type NavyFloorPlansSlice = prismic.SharedSlice<"navy_floor_plans", NavyFloorPlansSliceVariation>;

/**
 * Item in *NavyHeroSlider → Default → Primary → slides*
 */
export interface NavyHeroSliderSliceDefaultPrimarySlidesItem {
	/**
	 * image field in *NavyHeroSlider → Default → Primary → slides*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_hero_slider.default.primary.slides[].image
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	image: prismic.ImageField<never>;
}

/**
 * Primary content in *NavyHeroSlider → Default → Primary*
 */
export interface NavyHeroSliderSliceDefaultPrimary {
	/**
	 * logo field in *NavyHeroSlider → Default → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_hero_slider.default.primary.logo
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	logo: prismic.ImageField<never>;
	
	/**
	 * tagline_line_1 field in *NavyHeroSlider → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. Creative Lofts
	 * - **API ID Path**: navy_hero_slider.default.primary.tagline_line_1
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	tagline_line_1: prismic.KeyTextField;
	
	/**
	 * tagline_line_2 field in *NavyHeroSlider → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. for Lease
	 * - **API ID Path**: navy_hero_slider.default.primary.tagline_line_2
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	tagline_line_2: prismic.KeyTextField;
	
	/**
	 * slides field in *NavyHeroSlider → Default → Primary*
	 *
	 * - **Field Type**: Group
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_hero_slider.default.primary.slides[]
	 * - **Documentation**: https://prismic.io/docs/fields/repeatable-group
	 */
	slides: prismic.GroupField<Simplify<NavyHeroSliderSliceDefaultPrimarySlidesItem>>;
	
	/**
	 * mobile_location_image field in *NavyHeroSlider → Default → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_hero_slider.default.primary.mobile_location_image
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	mobile_location_image: prismic.ImageField<never>;
}

/**
 * Default variation for NavyHeroSlider Slice
 *
 * - **API ID**: `default`
 * - **Description**: Six-photo gallery standing 100vh (50vh below 768), a right-offset logo block, and a separate aerial shown only at 767 and under
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type NavyHeroSliderSliceDefault = prismic.SharedSliceVariation<"default", Simplify<NavyHeroSliderSliceDefaultPrimary>, never>;

/**
 * Slice variation for *NavyHeroSlider*
 */
type NavyHeroSliderSliceVariation = NavyHeroSliderSliceDefault

/**
 * NavyHeroSlider Shared Slice
 *
 * - **API ID**: `navy_hero_slider`
 * - **Description**: Full-viewport photo slider with the overlaid mark and lease tagline, plus the mobile-only aerial
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type NavyHeroSliderSlice = prismic.SharedSlice<"navy_hero_slider", NavyHeroSliderSliceVariation>;

/**
 * Primary content in *NavyLocationBand → Default → Primary*
 */
export interface NavyLocationBandSliceDefaultPrimary {
	/**
	 * heading field in *NavyLocationBand → Default → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_location_band.default.primary.heading
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	heading: prismic.RichTextField;
	
	/**
	 * background_image field in *NavyLocationBand → Default → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_location_band.default.primary.background_image
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	background_image: prismic.ImageField<never>;
}

/**
 * Default variation for NavyLocationBand Slice
 *
 * - **API ID**: `default`
 * - **Description**: Aerial photo standing 100vh tall, with one left-offset heading
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type NavyLocationBandSliceDefault = prismic.SharedSliceVariation<"default", Simplify<NavyLocationBandSliceDefaultPrimary>, never>;

/**
 * Slice variation for *NavyLocationBand*
 */
type NavyLocationBandSliceVariation = NavyLocationBandSliceDefault

/**
 * NavyLocationBand Shared Slice
 *
 * - **API ID**: `navy_location_band`
 * - **Description**: Full-viewport aerial photo band with a single heading
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type NavyLocationBandSlice = prismic.SharedSlice<"navy_location_band", NavyLocationBandSliceVariation>;

/**
 * Item in *NavyResidentLinks → Default → Primary → tiles*
 */
export interface NavyResidentLinksSliceDefaultPrimaryTilesItem {
	/**
	 * label field in *NavyResidentLinks → Default → Primary → tiles*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. Paying rent online?
	 * - **API ID Path**: navy_resident_links.default.primary.tiles[].label
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	label: prismic.KeyTextField;
	
	/**
	 * link field in *NavyResidentLinks → Default → Primary → tiles*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.tiles[].link
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	link: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
	
	/**
	 * modal field in *NavyResidentLinks → Default → Primary → tiles*
	 *
	 * - **Field Type**: Select
	 * - **Placeholder**: opens no popup
	 * - **API ID Path**: navy_resident_links.default.primary.tiles[].modal
	 * - **Documentation**: https://prismic.io/docs/fields/select
	 */
	modal: prismic.SelectField<"electric" | "laundry" | "gym" | "tv_internet" | "ride" | "food">;
}

/**
 * Primary content in *NavyResidentLinks → Default → Primary*
 */
export interface NavyResidentLinksSliceDefaultPrimary {
	/**
	 * heading field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.heading
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	heading: prismic.RichTextField;
	
	/**
	 * tiles field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Group
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.tiles[]
	 * - **Documentation**: https://prismic.io/docs/fields/repeatable-group
	 */
	tiles: prismic.GroupField<Simplify<NavyResidentLinksSliceDefaultPrimaryTilesItem>>;
	
	/**
	 * electric_title field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.electric_title
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	electric_title: prismic.KeyTextField;
	
	/**
	 * electric_body field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.electric_body
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	electric_body: prismic.RichTextField;
	
	/**
	 * laundry_title field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.laundry_title
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	laundry_title: prismic.KeyTextField;
	
	/**
	 * laundry_logo field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.laundry_logo
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	laundry_logo: prismic.ImageField<never>;
	
	/**
	 * laundry_link field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.laundry_link
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	laundry_link: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
	
	/**
	 * gym_title field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.gym_title
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	gym_title: prismic.KeyTextField;
	
	/**
	 * gym_logo_1 field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.gym_logo_1
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	gym_logo_1: prismic.ImageField<never>;
	
	/**
	 * gym_link_1 field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.gym_link_1
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	gym_link_1: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
	
	/**
	 * gym_logo_2 field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.gym_logo_2
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	gym_logo_2: prismic.ImageField<never>;
	
	/**
	 * gym_link_2 field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.gym_link_2
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	gym_link_2: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
	
	/**
	 * tv_title field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.tv_title
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	tv_title: prismic.KeyTextField;
	
	/**
	 * tv_logo field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.tv_logo
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	tv_logo: prismic.ImageField<never>;
	
	/**
	 * tv_link field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.tv_link
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	tv_link: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
	
	/**
	 * tv_body field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.tv_body
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	tv_body: prismic.RichTextField;
	
	/**
	 * ride_title field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.ride_title
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	ride_title: prismic.KeyTextField;
	
	/**
	 * ride_logo_1 field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.ride_logo_1
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	ride_logo_1: prismic.ImageField<never>;
	
	/**
	 * ride_link_1 field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.ride_link_1
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	ride_link_1: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
	
	/**
	 * ride_logo_2 field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.ride_logo_2
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	ride_logo_2: prismic.ImageField<never>;
	
	/**
	 * ride_link_2 field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.ride_link_2
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	ride_link_2: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
	
	/**
	 * food_title field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.food_title
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	food_title: prismic.KeyTextField;
	
	/**
	 * food_logo_1 field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.food_logo_1
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	food_logo_1: prismic.ImageField<never>;
	
	/**
	 * food_link_1 field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.food_link_1
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	food_link_1: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
	
	/**
	 * food_logo_2 field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.food_logo_2
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	food_logo_2: prismic.ImageField<never>;
	
	/**
	 * food_link_2 field in *NavyResidentLinks → Default → Primary*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navy_resident_links.default.primary.food_link_2
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	food_link_2: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
}

/**
 * Default variation for NavyResidentLinks Slice
 *
 * - **API ID**: `default`
 * - **Description**: Eight black tiles split across two columns; seven open a popup, one links out
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type NavyResidentLinksSliceDefault = prismic.SharedSliceVariation<"default", Simplify<NavyResidentLinksSliceDefaultPrimary>, never>;

/**
 * Slice variation for *NavyResidentLinks*
 */
type NavyResidentLinksSliceVariation = NavyResidentLinksSliceDefault

/**
 * NavyResidentLinks Shared Slice
 *
 * - **API ID**: `navy_resident_links`
 * - **Description**: Two columns of resident-service tiles, plus the six amenity popups they open
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type NavyResidentLinksSlice = prismic.SharedSlice<"navy_resident_links", NavyResidentLinksSliceVariation>;

/**
 * Primary content in *RichText → Default → Primary*
 */
export interface RichTextSliceDefaultPrimary {
	/**
	 * content field in *RichText → Default → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: rich_text.default.primary.content
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	content: prismic.RichTextField;
}

/**
 * Default variation for RichText Slice
 *
 * - **API ID**: `default`
 * - **Description**: Default
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type RichTextSliceDefault = prismic.SharedSliceVariation<"default", Simplify<RichTextSliceDefaultPrimary>, never>;

/**
 * Slice variation for *RichText*
 */
type RichTextSliceVariation = RichTextSliceDefault

/**
 * RichText Shared Slice
 *
 * - **API ID**: `rich_text`
 * - **Description**: RichText
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type RichTextSlice = prismic.SharedSlice<"rich_text", RichTextSliceVariation>;

/**
 * Primary content in *SectionGrid → Default → Primary*
 */
export interface SectionGridSliceDefaultPrimary {
	/**
	 * heading field in *SectionGrid → Default → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: section_grid.default.primary.heading
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	heading: prismic.RichTextField;
	
	/**
	 * columns field in *SectionGrid → Default → Primary*
	 *
	 * - **Field Type**: Number
	 * - **Placeholder**: 3
	 * - **API ID Path**: section_grid.default.primary.columns
	 * - **Documentation**: https://prismic.io/docs/fields/number
	 */
	columns: prismic.NumberField;
}

/**
 * Primary content in *SectionGrid → Items*
 */
export interface SectionGridSliceDefaultItem {
	/**
	 * item_heading field in *SectionGrid → Items*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: section_grid.items[].item_heading
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	item_heading: prismic.RichTextField;
	
	/**
	 * item_body field in *SectionGrid → Items*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: section_grid.items[].item_body
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	item_body: prismic.RichTextField;
	
	/**
	 * item_media field in *SectionGrid → Items*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: section_grid.items[].item_media
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	item_media: prismic.ImageField<never>;
	
	/**
	 * item_link field in *SectionGrid → Items*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: section_grid.items[].item_link
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	item_link: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
}

/**
 * Default variation for SectionGrid Slice
 *
 * - **API ID**: `default`
 * - **Description**: Heading plus a grid of item cards
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type SectionGridSliceDefault = prismic.SharedSliceVariation<"default", Simplify<SectionGridSliceDefaultPrimary>, Simplify<SectionGridSliceDefaultItem>>;

/**
 * Slice variation for *SectionGrid*
 */
type SectionGridSliceVariation = SectionGridSliceDefault

/**
 * SectionGrid Shared Slice
 *
 * - **API ID**: `section_grid`
 * - **Description**: N-column grid of card items
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type SectionGridSlice = prismic.SharedSlice<"section_grid", SectionGridSliceVariation>;

/**
 * Primary content in *Testimonial → Default → Primary*
 */
export interface TestimonialSliceDefaultPrimary {
	/**
	 * label field in *Testimonial → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. What clients are saying
	 * - **API ID Path**: testimonial.default.primary.label
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	label: prismic.KeyTextField;
	
	/**
	 * quote field in *Testimonial → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: Quote text WITHOUT the “ ” marks — the component draws them
	 * - **API ID Path**: testimonial.default.primary.quote
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	quote: prismic.KeyTextField;
	
	/**
	 * name field in *Testimonial → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. Dana Whitfield
	 * - **API ID Path**: testimonial.default.primary.name
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	name: prismic.KeyTextField;
	
	/**
	 * role field in *Testimonial → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. Director of Operations, Northgate
	 * - **API ID Path**: testimonial.default.primary.role
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	role: prismic.KeyTextField;
	
	/**
	 * avatar field in *Testimonial → Default → Primary*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: testimonial.default.primary.avatar
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	avatar: prismic.ImageField<never>;
}

/**
 * Default variation for Testimonial Slice
 *
 * - **API ID**: `default`
 * - **Description**: An attributed pull quote with an optional avatar/name/role credit
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type TestimonialSliceDefault = prismic.SharedSliceVariation<"default", Simplify<TestimonialSliceDefaultPrimary>, never>;

/**
 * Slice variation for *Testimonial*
 */
type TestimonialSliceVariation = TestimonialSliceDefault

/**
 * Testimonial Shared Slice
 *
 * - **API ID**: `testimonial`
 * - **Description**: Testimonial
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type TestimonialSlice = prismic.SharedSlice<"testimonial", TestimonialSliceVariation>;

/**
 * Item in *TextColumns → Default → Primary → columns*
 */
export interface TextColumnsSliceDefaultPrimaryColumnsItem {
	/**
	 * title field in *TextColumns → Default → Primary → columns*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: text_columns.default.primary.columns[].title
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	title: prismic.KeyTextField;
	
	/**
	 * body field in *TextColumns → Default → Primary → columns*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: text_columns.default.primary.columns[].body
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	body: prismic.RichTextField;
}

/**
 * Primary content in *TextColumns → Default → Primary*
 */
export interface TextColumnsSliceDefaultPrimary {
	/**
	 * eyebrow field in *TextColumns → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. Our Solution
	 * - **API ID Path**: text_columns.default.primary.eyebrow
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	eyebrow: prismic.KeyTextField;
	
	/**
	 * hasTopRule field in *TextColumns → Default → Primary*
	 *
	 * - **Field Type**: Boolean
	 * - **Placeholder**: *None*
	 * - **Default Value**: true
	 * - **API ID Path**: text_columns.default.primary.hasTopRule
	 * - **Documentation**: https://prismic.io/docs/fields/boolean
	 */
	hasTopRule: prismic.BooleanField;
	
	/**
	 * desktopColumns field in *TextColumns → Default → Primary*
	 *
	 * - **Field Type**: Select
	 * - **Placeholder**: *None*
	 * - **Default Value**: 3
	 * - **API ID Path**: text_columns.default.primary.desktopColumns
	 * - **Documentation**: https://prismic.io/docs/fields/select
	 */
	desktopColumns: prismic.SelectField<"2" | "3" | "4", "filled">;
	
	/**
	 * columns field in *TextColumns → Default → Primary*
	 *
	 * - **Field Type**: Group
	 * - **Placeholder**: *None*
	 * - **API ID Path**: text_columns.default.primary.columns[]
	 * - **Documentation**: https://prismic.io/docs/fields/repeatable-group
	 */
	columns: prismic.GroupField<Simplify<TextColumnsSliceDefaultPrimaryColumnsItem>>;
}

/**
 * Default variation for TextColumns Slice
 *
 * - **API ID**: `default`
 * - **Description**: An eyebrow, an optional rule, and a row of text columns
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type TextColumnsSliceDefault = prismic.SharedSliceVariation<"default", Simplify<TextColumnsSliceDefaultPrimary>, never>;

/**
 * Slice variation for *TextColumns*
 */
type TextColumnsSliceVariation = TextColumnsSliceDefault

/**
 * TextColumns Shared Slice
 *
 * - **API ID**: `text_columns`
 * - **Description**: TextColumns
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type TextColumnsSlice = prismic.SharedSlice<"text_columns", TextColumnsSliceVariation>;

declare module "@prismicio/client" {
	interface CreateClient {
		(repositoryNameOrEndpoint: string, options?: prismic.ClientConfig): prismic.Client<AllDocumentTypes>;
	}
	
	interface CreateWriteClient {
		(repositoryNameOrEndpoint: string, options: prismic.WriteClientConfig): prismic.WriteClient<AllDocumentTypes>;
	}
	
	interface CreateMigration {
		(): prismic.Migration<AllDocumentTypes>;
	}
	
	namespace Content {
		export type {
			FormRepliesDocument,
			FormRepliesDocumentData,
			FormRepliesDocumentDataRepliesItem,
			PageDocument,
			PageDocumentData,
			PageDocumentDataSlicesSlice,
			AllDocumentTypes,
			AccordionSlice,
			AccordionSliceDefaultPrimaryItemsItem,
			AccordionSliceDefaultPrimary,
			AccordionSliceVariation,
			AccordionSliceDefault,
			CtaBannerSlice,
			CtaBannerSliceDefaultPrimary,
			CtaBannerSliceVariation,
			CtaBannerSliceDefault,
			HeroSlice,
			HeroSliceDefaultPrimary,
			HeroSliceVariation,
			HeroSliceDefault,
			LeadTextSlice,
			LeadTextSliceDefaultPrimary,
			LeadTextSliceVariation,
			LeadTextSliceDefault,
			MediaTextSlice,
			MediaTextSliceImageRightPrimary,
			MediaTextSliceImageLeftPrimary,
			MediaTextSliceVariation,
			MediaTextSliceImageRight,
			MediaTextSliceImageLeft,
			NavyContactSlice,
			NavyContactSliceDefaultPrimaryLinksItem,
			NavyContactSliceDefaultPrimary,
			NavyContactSliceVariation,
			NavyContactSliceDefault,
			NavyFloorPlansSlice,
			NavyFloorPlansSliceDefaultPrimaryFloorsItem,
			NavyFloorPlansSliceDefaultPrimary,
			NavyFloorPlansSliceVariation,
			NavyFloorPlansSliceDefault,
			NavyHeroSliderSlice,
			NavyHeroSliderSliceDefaultPrimarySlidesItem,
			NavyHeroSliderSliceDefaultPrimary,
			NavyHeroSliderSliceVariation,
			NavyHeroSliderSliceDefault,
			NavyLocationBandSlice,
			NavyLocationBandSliceDefaultPrimary,
			NavyLocationBandSliceVariation,
			NavyLocationBandSliceDefault,
			NavyResidentLinksSlice,
			NavyResidentLinksSliceDefaultPrimaryTilesItem,
			NavyResidentLinksSliceDefaultPrimary,
			NavyResidentLinksSliceVariation,
			NavyResidentLinksSliceDefault,
			RichTextSlice,
			RichTextSliceDefaultPrimary,
			RichTextSliceVariation,
			RichTextSliceDefault,
			SectionGridSlice,
			SectionGridSliceDefaultPrimary,
			SectionGridSliceDefaultItem,
			SectionGridSliceVariation,
			SectionGridSliceDefault,
			TestimonialSlice,
			TestimonialSliceDefaultPrimary,
			TestimonialSliceVariation,
			TestimonialSliceDefault,
			TextColumnsSlice,
			TextColumnsSliceDefaultPrimaryColumnsItem,
			TextColumnsSliceDefaultPrimary,
			TextColumnsSliceVariation,
			TextColumnsSliceDefault
		}
	}
}