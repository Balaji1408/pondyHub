/** Default guest guide content (inspired by paradiseGBT.com/guide). */

export type GuideContact = { label: string; phone: string }
export type GuideContactGroup = { title: string; subtitle?: string; contacts: GuideContact[] }
export type GuidePlace = { name: string; description: string; mapUrl: string }
export type GuidePlaceGroup = { title: string; places: GuidePlace[] }
export type GuidePolicyHighlight = { label: string; value: string }
export type GuidePolicyBlock = { title: string; bullets: string[] }

export type GuideSection =
  | {
      id: string
      type: 'contacts'
      title: string
      intro?: string
      groups: GuideContactGroup[]
    }
  | {
      id: string
      type: 'places'
      title: string
      intro?: string
      groups: GuidePlaceGroup[]
    }
  | {
      id: string
      type: 'policy'
      title: string
      intro?: string
      highlights: GuidePolicyHighlight[]
      blocks: GuidePolicyBlock[]
    }

export type GuideContent = {
  title: string
  subtitle: string
  sections: GuideSection[]
  footer: {
    thanks: string
    phones: GuideContact[]
    address: string
  }
}

export const DEFAULT_GUIDE: GuideContent = {
  title: 'Guest welcome guide',
  subtitle:
    'Everything for your stay in Pondicherry: who to call, where to go, and how we host.',
  sections: [
    {
      id: 'services',
      type: 'contacts',
      title: 'Services and contacts',
      intro: 'Tap any number to call. Contact providers directly for bookings and assistance.',
      groups: [
        {
          title: 'Boating and adventure',
          subtitle: 'Speed boats, scuba diving and sea rides',
          contacts: [
            { label: 'Boating & adventure', phone: '8925987530' },
            { label: 'PV Adventure', phone: '9944499254' },
            { label: 'Scuba diving', phone: '9791351801' },
            { label: 'Boating', phone: '9789442200' },
            { label: 'Marine', phone: '9629448863' },
          ],
        },
        {
          title: 'Catering service',
          subtitle: 'Meals for groups, parties and functions',
          contacts: [
            { label: 'Catering', phone: '8072751016' },
            { label: 'Catering', phone: '9786632384' },
            { label: 'Prabhakaran Sankar', phone: '9003678049' },
            { label: 'Huns Catering', phone: '8110042166' },
          ],
        },
        {
          title: 'Bike, car and bus rental',
          subtitle: 'Two-wheelers, cabs and group transport',
          contacts: [
            { label: 'Rentals', phone: '8610085953' },
            { label: 'State pathway', phone: '9894387356' },
            { label: 'Auroville', phone: '9443468402' },
            { label: 'Honey bike', phone: '9597478121' },
            { label: 'First fly', phone: '8124778784' },
          ],
        },
        {
          title: 'Spa service',
          subtitle: 'Massage and wellness therapies',
          contacts: [
            { label: 'Sattva Wellness Spa', phone: '9940921088' },
            { label: 'Spa', phone: '9585161628' },
          ],
        },
        {
          title: 'Decoration, celebrations and surprises',
          contacts: [
            { label: 'Velmurugan Decors', phone: '8754005867' },
            { label: 'Decorator', phone: '7708413458' },
            { label: 'Boating surprise', phone: '9629448863' },
          ],
        },
      ],
    },
    {
      id: 'places',
      type: 'places',
      title: 'Places to visit',
      intro: 'In and around Pondicherry. Tap a card to open the location in Google Maps.',
      groups: [
        {
          title: 'Auroville and the Ashram',
          places: [
            {
              name: 'Auroville Matrimandir',
              description:
                'The golden sphere at the heart of Auroville, built for silent concentration. The viewing point is open to day visitors.',
              mapUrl: 'https://www.google.com/maps/search/?api=1&query=Matrimandir+Auroville',
            },
            {
              name: 'Sri Aurobindo Ashram',
              description:
                'The spiritual centre of Pondicherry in White Town. Visitors sit in silence around the flower-covered Samadhi.',
              mapUrl: 'https://www.google.com/maps/search/?api=1&query=Sri+Aurobindo+Ashram+Pondicherry',
            },
            {
              name: 'Sadhana Forest',
              description:
                'A volunteer-run reforestation community on the edge of Auroville, known for eco tours.',
              mapUrl: 'https://www.google.com/maps/search/?api=1&query=Sadhana+Forest+Auroville',
            },
          ],
        },
        {
          title: 'Beaches and boat houses',
          places: [
            {
              name: 'White Town and Rock Beach',
              description:
                'The French Quarter with colonial streets and cafés, opening onto the Promenade. Perfect for an evening walk.',
              mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rock+Beach+Pondicherry',
            },
            {
              name: 'Serenity Beach',
              description:
                'A fishing-village beach just north of town, popular for surfing lessons and sunrise views.',
              mapUrl: 'https://www.google.com/maps/search/?api=1&query=Serenity+Beach+Pondicherry',
            },
            {
              name: 'Paradise Island boat house',
              description:
                'A sandy island beach reached only by boat across the backwaters. Carry a cap and water.',
              mapUrl: 'https://www.google.com/maps/search/?api=1&query=Paradise+Beach+Pondicherry',
            },
            {
              name: 'Chunnambar boat house',
              description:
                'Government boat house south of town. Backwater rides and the ferry to Paradise Beach start here.',
              mapUrl: 'https://www.google.com/maps/search/?api=1&query=Chunnambar+Boat+House',
            },
          ],
        },
        {
          title: 'Churches and temples',
          places: [
            {
              name: 'Basilica of the Sacred Heart of Jesus',
              description:
                'A Gothic-style basilica famous for its stained glass panels. One of the most photographed churches in town.',
              mapUrl:
                'https://www.google.com/maps/search/?api=1&query=Basilica+of+the+Sacred+Heart+of+Jesus+Pondicherry',
            },
            {
              name: 'Manakula Vinayagar Temple',
              description:
                'A centuries-old Ganesha temple in White Town. Look up at the painted ceilings and golden tower.',
              mapUrl: 'https://www.google.com/maps/search/?api=1&query=Manakula+Vinayagar+Temple',
            },
          ],
        },
      ],
    },
    {
      id: 'accommodation',
      type: 'policy',
      title: 'Accommodation policy',
      intro: 'Please read before your stay. Thank you for helping us keep every property comfortable for all guests.',
      highlights: [
        { label: 'Check-in', value: '12:00 PM' },
        { label: 'Check-out', value: '11:00 AM' },
        { label: 'Payment', value: '100% at check-in' },
        { label: 'Cancellation', value: '62 hours before' },
      ],
      blocks: [
        {
          title: 'Reservations',
          bullets: [
            'Reservations can be made through our website, by phone, or directly at the property.',
            'A valid form of payment may be required to guarantee reservations in peak season.',
          ],
        },
        {
          title: 'Check-in and check-out',
          bullets: [
            'Check-in time is 12:00 PM and check-out time is 11:00 AM.',
            'Early check-in or late check-out may be available on request, subject to availability.',
          ],
        },
        {
          title: 'Payment',
          bullets: [
            'We accept Cash, GPay, all UPI payments, Credit Cards and Debit Cards.',
            'Payment for the entire stay (100%) is due at the time of check-in.',
          ],
        },
        {
          title: 'Cancellation',
          bullets: [
            'Cancellations must be informed at least 62 hours before check-in.',
            'No-shows may be subject to a penalty charge.',
          ],
        },
        {
          title: 'Guest conduct',
          bullets: [
            'Guests are expected to be respectful towards other guests and staff.',
            'Disruptive behaviour may result in immediate eviction without refund.',
            'The property is non-smoking except in designated areas.',
          ],
        },
      ],
    },
    {
      id: 'pool',
      type: 'policy',
      title: 'Swimming pool policy',
      intro: 'Applies to properties with a swimming pool.',
      highlights: [
        { label: 'Pool hours', value: '7 AM – 7 PM' },
        { label: 'Who can use it', value: 'Registered guests' },
        { label: 'Under 12', value: 'With an adult' },
      ],
      blocks: [
        {
          title: 'Pool hours',
          bullets: [
            'The swimming pool is open to registered guests from 7:00 AM to 7:00 PM daily.',
            'Hours may change due to weather, maintenance or special events.',
          ],
        },
        {
          title: 'Safety first',
          bullets: [
            'No running, diving or roughhousing in the pool area.',
            'Children under 12 must be accompanied by an adult at all times.',
            'Swimwear is required. Glass containers are prohibited.',
          ],
        },
        {
          title: 'Hygiene',
          bullets: [
            'Please shower before entering the pool.',
            'Do not use the pool if you are unwell or have open wounds.',
          ],
        },
      ],
    },
  ],
  footer: {
    thanks: 'Thank you. Wishing you a happy and safe journey.',
    phones: [
      { label: 'Front desk', phone: '8056954927' },
      { label: 'Support', phone: '8110010344' },
    ],
    address: 'Pondicherry, India',
  },
}
