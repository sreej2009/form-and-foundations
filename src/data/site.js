// Everything the site after the construction film shows: imagery and copy.
//
// All images are local files under public/images/, optimised for the web.
// Photography: Unsplash (https://unsplash.com/license — free for commercial use).
// `source` records each original so any image can be traced or replaced; to
// swap one, drop a new file in the same folder and update its entry here.

const file = (path) => `${import.meta.env.BASE_URL}images/${path}`

export const architecturalImages = {
  // Scroll-driven sequence behind the hero, in order. All 3:2 landscape.
  // 01 is the room the camera enters through the building's glass facade, so
  // it shares the building's language: grey concrete panels, glass, timber.
  // `origin` is where the camera travels towards once inside (its vanishing point).
  hero: [
    {
      src: file('hero/hero-01-interior-entry.jpg'),
      width: 2200,
      height: 1466,
      origin: '55% 42%',
      position: '42% 50%',
      alt: 'A daylit interior of concrete panels, a black steel staircase with timber treads, and full-height glazing.',
      source: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
    },
    {
      src: file('hero/hero-02-residence-dusk.jpg'),
      width: 2200,
      height: 1466,
      alt: 'A contemporary residence at dusk, its glazed living spaces glowing beneath a eucalyptus tree.',
      source: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
    },
    {
      src: file('hero/hero-03-commercial-towers.jpg'),
      width: 2200,
      height: 1466,
      alt: 'Two glass office towers reflecting warm evening light, seen from below.',
      source: 'https://images.unsplash.com/photo-1431576901776-e539bd916ba2',
    },
    {
      src: file('hero/hero-04-pavilion-blue-hour.jpg'),
      width: 2200,
      height: 1466,
      alt: 'A low pavilion and reflecting pool lit at blue hour.',
      source: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
    },
    {
      src: file('hero/hero-05-landscape-development.jpg'),
      width: 2200,
      height: 1466,
      alt: 'Contemporary townhouses along a canal and landscaped green in low sunlight.',
      source: 'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb',
    },
  ],

  about: [
    {
      src: file('about/about-01-urban-residence.jpg'),
      width: 1600,
      height: 1066,
      alt: 'A contemporary residential building of dark panels, pale brick and deep-set windows against the sky.',
      source: 'https://images.unsplash.com/photo-1515263487990-61b07816b324',
    },
    {
      src: file('about/about-02-timber-facade.jpg'),
      width: 1100,
      height: 1650,
      alt: 'Dark metal cladding meeting vertical timber battens beside a lit entrance.',
      source: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d',
    },
    {
      src: file('about/about-03-interior-timber.jpg'),
      width: 1400,
      height: 952,
      alt: 'A bright living room with a timber feature wall and views to the garden.',
      source: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
    },
  ],

  projects: [
    {
      src: file('projects/project-01-hillside-residence.jpg'),
      width: 1800,
      height: 1200,
      alt: 'A dark-clad hillside residence at dusk, its tall windows lit from within.',
      source: 'https://images.unsplash.com/photo-1600585153490-76fb20a32601',
    },
    {
      src: file('projects/project-02-business-park.jpg'),
      width: 1800,
      height: 2700,
      alt: 'A curved glass curtain-wall office building reflecting the sky.',
      source: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a',
    },
    {
      src: file('projects/project-03-modern-living.jpg'),
      width: 1800,
      height: 1200,
      alt: 'A white contemporary villa with a timber soffit above a long swimming pool.',
      source: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811',
    },
  ],

  values: [
    {
      src: file('values/values-timber-frame.jpg'),
      width: 1800,
      height: 2184,
      alt: 'A multi-storey timber and steel frame rising against a clear blue sky.',
      source: 'https://images.unsplash.com/photo-1508450859948-4e04fabaa4ea',
    },
  ],

  contact: [
    {
      src: file('contact/contact-towers.jpg'),
      width: 2200,
      height: 1466,
      alt: '',
      source: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2',
    },
  ],
}

export const METRICS = [
  { value: '10+', label: ['Years of', 'experience'] },
  { value: '50+', label: ['Projects', 'delivered'] },
  { value: '2M+', label: ['Sq. ft.', 'developed'] },
]

export const PROJECTS = [
  { id: '01', name: 'Hillside Residence', category: 'Residential', image: architecturalImages.projects[0] },
  { id: '02', name: 'Business Park', category: 'Commercial', image: architecturalImages.projects[1] },
  { id: '03', name: 'Modern Living', category: 'Residential', image: architecturalImages.projects[2] },
]

export const PROCESS = [
  { id: '01', title: 'Planning', text: ['Understanding needs,', 'possibilities and context.'] },
  { id: '02', title: 'Design', text: ['Creating functional', 'and timeless spaces.'] },
  { id: '03', title: 'Construction', text: ['Executing with precision', 'and quality.'] },
  { id: '04', title: 'Handover', text: ['Spaces ready for', 'generations to come.'] },
]

export const VALUES = [
  { id: 'quality', name: 'Quality', text: 'Without compromise.' },
  { id: 'innovation', name: 'Innovation', text: 'For a better tomorrow.' },
  { id: 'sustainability', name: 'Sustainability', text: 'Spaces in harmony.' },
  { id: 'trust', name: 'Trust', text: 'In every relationship.' },
]
