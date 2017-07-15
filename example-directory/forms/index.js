module.exports = {
  'Company to Company': [
    {
      title: 'Company to Company',
      edition: '1e1d',
      released: '2017-07-03T03:13Z',
      description: [
        'a pretty terrible NDA between two companies'
      ],
      repository: 'https://github.com/rxnda/examples',
      commonform: {
        content: [
          'This is not a very good NDA. ' +
          'The parties will share information for ',
          {blank: ''},
          ' (the ',
          {definition: 'Purpose'},
          '). The law of ',
          {blank: ''},
          ' will govern.'
        ]
      },
      directions: [
        {
          blank: ['content', 1],
          label: 'Purpose',
          notes: [
            'Describe the reason the parties ' +
            'will share confidential information.'
          ]
        },
        {
          blank: ['content', 5],
          label: 'Governing Law',
          notes: [
            'Name the state whose laws will govern the contract.'
          ]
        }
      ],
      signatures: [
        {
          entities: [{}],
          information: ['date', 'email', 'address']
        },
        {
          entities: [{}],
          information: ['date', 'email', 'address']
        }
      ]
    }
  ],
  'Example NDA': [
    {
      title: 'Example NDA',
      edition: '1e1d',
      released: '2017-07-03T03:13Z',
      description: ['a pretty terrible NDA'],
      repository: 'https://github.com/rxnda/example',
      commonform: {
        content: [
          'This is not a very good NDA. ' +
          'The parties will share information for ',
          {blank: ''},
          ' (the ',
          {definition: 'Purpose'},
          ').'
        ]
      },
      directions: [
        {
          blank: ['content', 1],
          label: 'Purpose',
          notes: [
            'Describe the reason the parties will ' +
            'share confidential information.'
          ]
        }
      ],
      signatures: [
        {
          information: ['date', 'email', 'address']
        },
        {
          entities: [{}],
          information: ['date', 'email', 'address']
        }
      ]
    }
  ],
  Testing: [
    {
      title: 'Testing',
      edition: '1e1d',
      released: '2017-07-03T03:13Z',
      description: [
        'for testing'
      ],
      repository: 'https://github.com/rxnda/example',
      commonform: {
        content: [
          'This is not a very good NDA.'
        ]
      },
      directions: [],
      signatures: [
        {information: ['date', 'email']},
        {information: ['date', 'email']}
      ]
    },
    {
      title: 'Testing',
      edition: '1e',
      released: '2017-07-07T20:35Z',
      description: [
        'for testing'
      ],
      repository: 'https://github.com/rxnda/example',
      commonform: {
        content: [
          'This is still not a very good NDA.'
        ]
      },
      directions: [],
      signatures: [
        {information: ['date', 'email']},
        {information: ['date', 'email']}
      ]
    }
  ]
}
