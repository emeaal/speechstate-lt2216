import { MachineConfig, send, Action, assign } from "xstate";

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

const grammar: { [index: string]: { title?: string, day?: string, time?: string } } = {
    "Lecture.": { title: "Dialogue systems lecture" },
    "Lunch.": { title: "Lunch at the canteen" },
    "Dinner.": { title: "Dinner" },
    "Business.": { title: "Business meeting" },
    "Study session.": { title: "Study session" },
    "Walk.": { title: "Walk" },
    "Language course.": {title: "Language course" },
    "Programming course.": { title: "Programming course"},
    "Zoom meeting": {title: "Zoom meeting" },
    "Monday": { title: "Monday" },
    "Tuesday.": { day: "Tuesday" },
    "Wednesday.": { day: "Wednesday" },
    "Thursday.": { day: "Thursday" },
    "Friday": { day: "Friday" },
    "Saturday": { day: "Saturday" },
    "Sunday.": { day: "Sunday" },
    "Tomorrow.": { day: "tomorrow"},
    "10": { time: "10" },
    "11": { time: "11 " },
    "12": { time: "12 " },
    "1.": { time: "1 " },
    "2.": { time: "2" },
    "3.": { time: "3 " },
    "4.": { time: "4 " },
    "5.": { time: "5 " },
    "6.": { time: "6 " },
    "7.": { time: "7 " },
    "8.": { time: "8 " },
    "9.": { time: "9" },
    "At 10": { time: "10" },
    "At 11": { time: "11" },
    "At 12": { time: "12" },
    "At 1:00": { time: "1" },
    "At 2:00": { time: "2" },
    "At 3:00": { time: "3" },
    "At 4:00": { time: "4" },
    "At 5:00": { time: "5" },
    "At 6:00": { time: "6" },
    "At 7:00": { time: "7" },
    "At 8:00": { time: "8" },
    "At 9:00": { time: "9" },
    "At 1:00 PM.": { time: "1"},
    "At 2:00 PM.": { time: "2"},
    "At 3:00 PM.": { time: "3"},
    "At 4:00 PM.": { time: "4"},
    "At 5:00 PM.": { time: "5"},
    "At 6:00 PM.": { time: "6"},
    "At 7:00 PM.": { time: "7"},
    "At 8:00 PM.": { time: "8"},
    "At 9:00 PM.": { time: "9"},
    "At 10:00 PM.": { time: "10"},
    "At 11:00 PM.": { time: "11"},
    "At 6:00 AM.": { time: "6"},
    "At 7:00 AM.": { time: "7"},
    "At 8:00 AM.": { time: "8"},
    "At 9:00 AM.": { time: "9"},
    "At 10:00 AM.": { time: "10"},
    "At 11:00 AM.": { time: "11"},
    "At noon": { time: "noon"},
}

const answer: { [index: string]: { pos?: string, neg?: string, help?: string} } = {
    "Yes.": { pos: "Yes" },
    "Yes": { pos: "Yes" },
    "Okay.": { pos: "Yes" },
    "No.": { neg: "No" },
    "Of course.": { pos: "Yes" },
    "No way.": { neg: "No" },
    "Absolutely not.": { neg: "No" },
    "Absolutely": { pos: "Yes"},
    "Sure": { pos: "Yes" },
    "Yes please.": { pos: "Yes" },
    "Help.": { help: "Help" },
    "I need help.": { help: "Help" },
    "What do I do?": { help: "Help" },
}

const menugrammar: { [index: string]: {meet?: string, celeb?: string, assistant?: string }} = {
    "Create a meeting.": { meet: "Meeting" },
    "I want to create a meeting.": { meet: "Meeting" },
    "Meeting": {meet: "Meeting"},
    "Meet a celebrity.": { celeb: "Meet a celebrity" },
    "Celebrity.": { celeb: "celebrity" },
    "Search for someone.": { celeb: "Search for someone" },
    "Search for a celebrity": { celeb: "Search for a celebrity" },
    "Assistant.": {assistant: "Assistant"},
    "Intent.": {assistant: "Assistant"},
    "Do intent": {assistant: "Assistant"}
}

const assistant_grammar: {[index: string]: {intent?: string}} = {
    "Vacuum.": {intent: "Vacuum"},
    "Move to trash.": {intent: "Throw this in the trash"},
    "Give.": {intent: "Give this"},
    "Turn on the light": {intent: "Turn on the light"},
    "Turn off the light": {intent: "Turn off the light"},
    "Ask oven warm": {intent: "See if the oven is warm"},
    "Inform oven warm": {intent: "Say that oven is warm"}
}

const kbRequest = (text: string) =>
    fetch(new Request(`https://cors.eu.org/https://api.duckduckgo.com/?q=${text}&format=json&skip_disambig=1&kl=us_en`)).then(data => data.json())

const rasaurl = 'https://intentrecog.herokuapp.com/model/parse';

const nluRequest = (text: string) =>
  fetch(new Request(rasaurl, {
      method: 'POST',
      body: `{"text": "${text}"}`
  }))
      .then(data => data.json());

const confid_threshold = 0.6  // confidence threshold set to 0.6, if below this, speech wont be recognized

const sayConfirm: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `Did you mean to say ${context.checker}?`
}))

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'idle',
        states: {
        idle: {
            on: {
                CLICK: 'init'
            }
        },
        init: {
            on: {
                TTS_READY: 'createAppointment',
                CLICK: 'createAppointment',
            }
        },
        getHelp: { // can get called from any part of "createAppointment"
            initial: 'helpmessage',
            states: {
                helpmessage: {
                    entry: say("Listen to the instructions and make sure to speak clearly."),
                    on: { ENDSPEECH: '#root.dm.createAppointment.hist' } // returns to same state as before help was called
                }
            }
        },
        noMatch: {
            entry: say("I didn't understand, could you please repeat that?"),
            on: {ENDSPEECH: '#root.dm.createAppointment.deeperhist'} // returns to "listens" so user can repeat or rephrase their utterance
        },
        createAppointment: {
            initial: 'lookup_intent',
            states: {
                hist: {
                    type: 'history',
                },
                deeperhist: {
                    type: 'history',
                    history: 'deep',
                },
                hello: {
                    initial: 'prompt1',
                    entry: assign({counter: (context) => context.counter = 0}),
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => "help" in (answer[context.recResult[0].utterance] || {}),
                            },
                            {
                                target: 'mainmenu',
                                cond: (context) => context.recResult[0].confidence > confid_threshold,
                                actions: assign({ username: (context) => context.recResult[0].utterance }) 
                            },
                            {
                                target: '#root.dm.noMatch'
                            },
                            ],
                        TIMEOUT: [
                            {
                                target: '.prompt1',
                                cond: (context) => context.counter === 0,
                            },
                            {
                                target: '.prompt2',
                                cond: (context) => context.counter === 1,
                            },
                            {
                                target: '.prompt3',
                                cond: (context) => context.counter === 2,
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => context.counter === 3,
                            },
                        ],
                        },
                    states: {
                        hist: {
                            type: 'history',
                        },
                        prompt1: {
                            entry: [say("What is your username?"), 
                                    assign({counter: (context) => context.counter +1})],
                            on: { ENDSPEECH: 'ask' }
                            },
                        prompt2: {
                            entry: [say("Please say your username"), 
                                    assign({counter: (context) => context.counter +1})],
                            on: { ENDSPEECH: 'ask' }
                            },
                        prompt3: {
                            entry: [say("What should I call you?"), 
                                    assign({counter: (context) => context.counter +1})],
                            on: { ENDSPEECH: 'ask' }
                            },
                        ask: {
                                entry: send('LISTEN'),
                            },
                        }
                    },
                mainmenu: {
                    initial: 'prompt',
                    entry: assign({counter: (context) => context.counter = 0}),
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => "help" in (answer[context.recResult[0].utterance] || {}),
                            },
                            {
                                target: 'welcome',
                                cond: (context) => "meet" in (menugrammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ meet: (context) => menugrammar[context.recResult[0].utterance].meet!})
                            },
                            {
                                target: 'confirm_meeting',
                                cond: (context) => "meet" in (menugrammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence < confid_threshold,
                                actions: assign({meet: (context) => menugrammar[context.recResult[0].utterance].meet!}) 
                            },
                            {
                                target: 'searchceleb',
                                cond: (context) => "celeb" in (menugrammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ celeb: (context) => menugrammar[context.recResult[0].utterance].celeb!})
                            },
                            {
                                target: 'confirm_search',
                                cond: (context) => "celeb" in (menugrammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence < confid_threshold,
                                actions: assign({ celeb: (context) => menugrammar[context.recResult[0].utterance].celeb!})
                            },
                            {
                                target: 'lookup_intent',
                                cond: (context) => "assistant" in (menugrammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ assistant: (context) => menugrammar[context.recResult[0].utterance].assistant!})
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                            ],
                        TIMEOUT: [
                            {
                                target: '.prompt',
                                cond: (context) => context.counter === 0,
                            },
                            {
                                target: '.prompt',
                                cond: (context) => context.counter === 1,
                            },
                            {
                                target: '.question_with_instructions',
                                cond: (context) => context.counter === 2
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => context.counter === 3,
                            },
                        ],
                    },
                    states: {
                        prompt: {
                            entry: send((context) => ({
                                type: 'SPEAK',
                                value: `Hi ${context.username}`
                            })),
                            on: { ENDSPEECH: 'question' },
                        },
                        question: {
                            entry: [say("What do you want to do?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask'}
                        },
                        question_with_instructions: {
                            entry: [say("You can create a meeting, search for someone or get help from your home assistant bot. What do you want to do?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask'}
                        },
                        ask: {
                            entry: send('LISTEN'),
                        },
                    }
                },
                confirm_meeting: {
                    initial: 'ask_confirm',
                    entry: assign({ checker: (context) => context.meet }),
                    on: {
                        RECOGNISED: [
                            {
                                target: 'welcome',
                                cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {})
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {})
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ]
                    },
                    states: {
                        ask_confirm: {
                            entry: sayConfirm,
                            on: {ENDSPEECH: 'ask'}
                        },
                        ask: {
                            entry: send('LISTEN')
                        }
                    }
                },
                confirm_search: {
                    initial: 'ask_confirm',
                    entry: assign({ checker: (context) => context.celeb }),
                    on: {
                        RECOGNISED: [
                            {
                                target: 'searchceleb',
                                cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {})
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {})
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ]
                    },
                    states: {
                        ask_confirm: {
                            entry: sayConfirm,
                            on: {ENDSPEECH: 'ask'}
                        },
                        ask: {
                            entry: send('LISTEN')
                        }
                    }
                },
                lookup_intent: {
                    initial: 'prompt1',
                    entry: assign({counter: (context) => context.counter = 0}),
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => "help" in (answer[context.recResult[0].utterance] || {}),
                            },
                            {
                                target: 'do_intent',
                                cond: (context) => "intent" in (assistant_grammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ intent: (context) => assistant_grammar[context.recResult[0].utterance].intent! })
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ],
                        TIMEOUT: [
                            {
                                target: '.prompt1',
                                cond: (context) => context.counter === 0,
                            },
                            {
                                target: '.prompt2',
                                cond: (context) => context.counter === 1,
                            },
                            {
                                target: '.prompt3',
                                cond: (context) => context.counter === 2,
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => context.counter === 3,
                            },
                        ],
                    },
                    states: {
                        prompt1: {
                            entry: [say("What can I do for you?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt2: {
                            entry: [say("What can I help you with?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt3: {
                            entry: [say("What do you need help with?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        ask: {
                            entry: send('LISTEN'),
                        },
                    }
                },
                do_intent: {
                    initial: 'findintent',
                    states: {
                        findintent: {
                            invoke: {
                                id: 'findintent',
                                src: (context, event) => nluRequest(context.intent),
                                onDone: {
                                    target: 'intentsuccess',
                                    actions: assign({ intent: (context, event) => event.data.intent.name})
                                },
                                onError: {
                                    target: "intentfailure",
                                    actions: assign({ intent: (context, event) => event.data.intent.name})
                                }
                            }
                        },
                        intentsuccess: {
                            entry: send((context) => ({
                                type: 'SPEAK',
                                value: `Ok I will ${context.intent}`
                                })),
                                on: {ENDSPEECH: '#root.dm.init'}
                        },
                        intentfailure: {
                            entry: send((context) => ({
                                type: 'SPEAK',
                                value: `Sorry, I can't ${context.intent}`
                                })),
                                on: {ENDSPEECH: '#root.dm.init'}
                        }
                    }
                },
                searchceleb: {
                    initial: 'prompt1',
                    entry: assign({counter: (context) => context.counter = 0}),
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => "help" in (answer[context.recResult[0].utterance] || {}),
                            },
                            {
                                target: 'testermenu',
                                cond: (context) => context.recResult[0].confidence > confid_threshold,
                                actions: assign({ celeb: (context) => context.recResult[0].utterance })
                            },
                            {
                                target: 'confirm_celeb',
                                cond: (context) => context.recResult[0].confidence < confid_threshold,
                                actions: assign({ celeb: (context) => context.recResult[0].utterance })
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ],
                        TIMEOUT: [
                            {
                                target: '.prompt1',
                                cond: (context) => context.counter === 0,
                            },
                            {
                                target: '.prompt2',
                                cond: (context) => context.counter === 1,
                            },
                            {
                                target: '.prompt3',
                                cond: (context) => context.counter === 2,
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => context.counter === 3,
                            },
                        ],
                    },
                    states: {
                        prompt1: {
                            entry: [say("Who are you searching for?"), assign({counter: (context) => context.counter + 1})],
                            on: {ENDSPEECH: 'ask'}
                        },
                        prompt2: {
                            entry: [say("Please tell me who you are searching for"), assign({counter: (context) => context.counter + 1})],
                            on: {ENDSPEECH: 'ask'}
                        },
                        prompt3: {
                            entry: [say("Tell me the name of a celebrity and I will look them up for you"), assign({counter: (context) => context.counter + 1})],
                            on: {ENDSPEECH: 'ask'}
                        },
                        ask: {
                            entry: send('LISTEN')
                        }
                    }
                },
                confirm_celeb: {
                    initial: 'ask_confirm',
                    entry: assign({ checker: (context) => context.celeb }),
                    on: {
                        RECOGNISED: [
                            {
                                target: 'testermenu',
                                cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {})
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {})
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ]
                    },
                    states: {
                        ask_confirm: {
                            entry: sayConfirm,
                            on: {ENDSPEECH: 'ask'}
                        },
                        ask: {
                            entry: send('LISTEN')
                        }
                    }
                },
                testermenu: {
                    invoke: {
                        id: 'duck',
                        src: (context, event) => kbRequest(context.celeb),
                        onDone: {
                            target: 'success',
                            actions: assign({ title: (context, event) => "meeting with " + event.data.Heading, snippet: (context, event) => event.data.AbstractText }),
                        },
                        onError: {
                            target: 'failure',
                        },
                    },
                },
                success: {
                    entry: send((context) => ({
                        type: 'SPEAK',
                        value: `OK, ${context.snippet}`
                    })),
                    on: { ENDSPEECH: 'doyou' }
                },
                failure: {
                    entry: send((context) => ({
                        type: 'SPEAK',
                        value: `${context.celeb} couldn't be found.`,
                    })),
                    on: { ENDSPEECH: 'mainmenu' }
                },
                doyou: {
                    initial: 'prompt1',
                    entry: assign({counter: (context) => context.counter = 0}),
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => "help" in (answer[context.recResult[0].utterance] || {}),
                            },
                            {
                                target: 'day',
                                cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ pos: (context) => answer[context.recResult[0].utterance].pos! })
                            },
                            {
                                target: 'confirm_celebmeet',
                                cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {}) && context.recResult[0].confidence < confid_threshold,
                                actions: assign({ pos: (context) => answer[context.recResult[0].utterance].pos! })
                            },
                            {
                                target: 'mainmenu',
                                cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({neg: (context) => answer[context.recResult[0].utterance].neg!})
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ],
                        TIMEOUT: [
                            {
                                target: '.prompt1',
                                cond: (context) => context.counter === 0,
                            },
                            {
                                target: '.prompt2',
                                cond: (context) => context.counter === 1,
                            },
                            {
                                target: '.prompt3',
                                cond: (context) => context.counter === 2,
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => context.counter === 3,
                            },
                        ],
                    },
                    states: {
                        prompt1: {
                            entry: [say("Do you want to meet them?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt2: {
                            entry: [say("Do you want to meet this celebrity?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt3: {
                            entry: [say("Do you want to create a meeting with this person?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        ask: {
                            entry: send('LISTEN'),
                        },
                    }
                },
                confirm_celebmeet: {
                    initial: 'ask_confirm',
                    entry: assign({ checker: (context) => context.pos }),
                    on: {
                        RECOGNISED: [
                            {
                                target: 'day',
                                cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {})
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {})
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ]
                    },
                    states: {
                        ask_confirm: {
                            entry: sayConfirm,
                            on: {ENDSPEECH: 'ask'}
                        },
                        ask: {
                            entry: send('LISTEN')
                        }
                    }
                },
                welcome: {
                    entry: send((context) => ({
                        type: 'SPEAK',
                        value: `Let's create a meeting!`,
                    })),
                    on: { ENDSPEECH: 'regards' }
                },
                regards: {
                    initial: 'prompt1',
                    entry: assign({counter: (context) => context.counter = 0}),
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => "help" in (answer[context.recResult[0].utterance] || {}),
                            },
                            {
                                target: 'day',
                                cond: (context) => "title" in (grammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ title: (context) => grammar[context.recResult[0].utterance].title! })
                            },
                            {
                                target: 'confirm_regard',
                                cond: (context) => "title" in (grammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence < confid_threshold,
                                actions: assign({ title: (context) => grammar[context.recResult[0].utterance].title! })
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ],
                        TIMEOUT: [
                            {
                                target: '.prompt1',
                                cond: (context) => context.counter === 0,
                            },
                            {
                                target: '.prompt2',
                                cond: (context) => context.counter === 1,
                            },
                            {
                                target: '.prompt3',
                                cond: (context) => context.counter === 2,
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => context.counter === 3,
                            },
                        ],
                    },
                    states: {
                        prompt1: {
                            entry: [say("What is it about?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt2: {
                            entry: [say("What is your meeting about?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt3: {
                            entry: [say("What should your meeting be called?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        ask: {
                            entry: send('LISTEN'),
                        },
                    }
                },
                confirm_regard: {
                    initial: 'ask_confirm',
                    entry: assign({ checker: (context) => context.title }),
                    on: {
                        RECOGNISED: [
                            {
                                target: 'day',
                                cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {})
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {})
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ]
                    },
                    states: {
                        ask_confirm: {
                            entry: sayConfirm,
                            on: {ENDSPEECH: 'ask'}
                        },
                        ask: {
                            entry: send('LISTEN')
                        }
                    }
                },
                day: {
                    initial: 'prompt1',
                    entry: assign({counter: (context) => context.counter = 0}),
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => "help" in (answer[context.recResult[0].utterance] || {}),
                            },
                            {
                                target: 'durance',
                                cond: (context) => "day" in (grammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ day: (context) => grammar[context.recResult[0].utterance].day! })
                            },
                            {
                                target: 'confirm_day',
                                cond: (context) => "day" in (grammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence < confid_threshold,
                                actions: assign({ day: (context) => grammar[context.recResult[0].utterance].day! })
                            },
                            {
                                target: '.nomatch'
                            }
                        ],
                        TIMEOUT: [
                            {
                                target: '.prompt1',
                                cond: (context) => context.counter === 0,
                            },
                            {
                                target: '.prompt2',
                                cond: (context) => context.counter === 1,
                            },
                            {
                                target: '.prompt3',
                                cond: (context) => context.counter === 2,
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => context.counter === 3,
                            },
                        ],
                    },
                    states: {
                        prompt1: {
                            entry: [say("On which day is it?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt2: {
                            entry: [say("On which day will this meeting take place?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt3: {
                            entry: [say("Please tell me the day of this meeting."), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        ask: {
                            entry: send('LISTEN'),
                        },
                        nomatch: {
                            entry: say("Sorry, what day did you say?"),
                            on: { ENDSPEECH: 'ask' }
                        }
                    }
                },
                confirm_day: {
                    initial: 'ask_confirm',
                    entry: assign({ checker: (context) => context.day }),
                    on: {
                        RECOGNISED: [
                            {
                                target: 'durance',
                                cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {})
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {})
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ]
                    },
                    states: {
                        ask_confirm: {
                            entry: sayConfirm,
                            on: {ENDSPEECH: 'ask'}
                        },
                        ask: {
                            entry: send('LISTEN')
                        }
                    }
                },
                durance: {
                    initial: 'prompt1',
                    entry: assign({counter: (context) => context.counter = 0}),
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => "help" in (answer[context.recResult[0].utterance] || {}),
                            },
                            {
                                target: 'creationwholeday',
                                cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ pos: (context) => answer[context.recResult[0].utterance].pos! })
                            },
                            {
                                target: 'time',
                                cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ neg: (context) => answer[context.recResult[0].utterance].neg! })
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ],
                        TIMEOUT: [
                            {
                                target: '.prompt1',
                                cond: (context) => context.counter === 0,
                            },
                            {
                                target: '.prompt2',
                                cond: (context) => context.counter === 1,
                            },
                            {
                                target: '.prompt3',
                                cond: (context) => context.counter === 2,
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => context.counter === 3,
                            },
                        ],
                    },
                    states: {
                        prompt1: {
                            entry: [say("Will it take the whole day?"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt2: {
                            entry: [say("Will the meeting take the whole day?"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt3: {
                            entry: [say("Will the meeting take the whole day? You can say 'yes' or 'no'."), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        ask: {
                            entry: send('LISTEN'),
                        },
                    }
                },
                time: {
                    initial: 'prompt1',
                    entry: assign({counter: (context) => context.counter = 0}),
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => "help" in (answer[context.recResult[0].utterance] || {}),
                            },
                            {
                                target: 'creation_with_time',
                                cond: (context) => "time" in (grammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ time: (context) => grammar[context.recResult[0].utterance].time! })
                            },
                            {
                                target: 'confirm_time',
                                cond: (context) => "time" in (grammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence < confid_threshold,
                                actions: assign({ time: (context) => grammar[context.recResult[0].utterance].time! })
                            },
                            {
                                target: '.nomatch'
                            }
                        ],
                        TIMEOUT: [
                            {
                                target: '.prompt1',
                                cond: (context) => context.counter === 0,
                            },
                            {
                                target: '.prompt2',
                                cond: (context) => context.counter === 1,
                            },
                            {
                                target: '.prompt3',
                                cond: (context) => context.counter === 2,
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => context.counter === 3,
                            },
                        ],
                    },
                    states: {
                        prompt1: {
                            entry: [say("What time is your meeting?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt2: {
                            entry: [say("What time will this meeting be?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt3: {
                            entry: [say("At what time will this meeting take place?"), assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        ask: {
                            entry: send('LISTEN'),
                        },
                        nomatch: {
                            entry: say("Sorry, what time did you say?"),
                            on: { ENDSPEECH: 'ask' }
                        }
                    }
                },
                confirm_time: {
                    initial: 'ask_confirm',
                    entry: assign({ checker: (context) => context.time }),
                    on: {
                        RECOGNISED: [
                            {
                                target: 'creation_with_time',
                                cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {})
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {})
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ]
                    },
                    states: {
                        ask_confirm: {
                            entry: sayConfirm,
                            on: {ENDSPEECH: 'ask'}
                        },
                        ask: {
                            entry: send('LISTEN')
                        }
                    }
                },
                creationwholeday: {
                    initial: 'prompt1',
                    entry: assign({counter: (context) => context.counter = 0}),
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => "help" in (answer[context.recResult[0].utterance] || {}),
                            },
                            {
                                target: 'info',
                                cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ pos: (context) => answer[context.recResult[0].utterance].pos! })
                            },
                            {
                                target: 'regards',
                                cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ neg: (context) => answer[context.recResult[0].utterance].neg! })
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ],
                        TIMEOUT: [
                            {
                                target: '.prompt1',
                                cond: (context) => context.counter === 0,
                            },
                            {
                                target: '.prompt2',
                                cond: (context) => context.counter === 1,
                            },
                            {
                                target: '.prompt3',
                                cond: (context) => context.counter === 2,
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => context.counter === 3,
                            },
                        ],
                    },
                    states: {
                        prompt1: {
                            entry: [send((context) => ({
                                type: 'SPEAK',
                                value: `Do you want me to create a meeting titled ${context.title} on ${context.day}?`,
                            })),
                            assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt2: {
                            entry: [send((context) => ({
                                type: 'SPEAK',
                                value: `Should I create a meeting called ${context.title} on ${context.day}?`,
                            })),
                            assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt3: {
                            entry: [send((context) => ({
                                type: 'SPEAK',
                                value: `The information I've gotten is a meeting titled ${context.title} on ${context.day}. Should I create a meeting for that?`,
                            })),
                            assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },

                        ask: {
                            entry: send('LISTEN'),
                        },
                    }
                },
                creation_with_time: {
                    initial: 'prompt1',
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => "help" in (answer[context.recResult[0].utterance] || {}),
                            },
                            {
                                target: 'info',
                                cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {}),
                                actions: assign({ pos: (context) => answer[context.recResult[0].utterance].pos! })
                            },
                            {
                                target: 'regards',
                                cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {}),
                                actions: assign({ neg: (context) => answer[context.recResult[0].utterance].neg! })
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ],
                        TIMEOUT: [
                            {
                                target: '.prompt1',
                                cond: (context) => context.counter === 0,
                            },
                            {
                                target: '.prompt2',
                                cond: (context) => context.counter === 1,
                            },
                            {
                                target: '.prompt3',
                                cond: (context) => context.counter === 2,
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => context.counter === 3,
                            },
                        ],
                    },
                    states: {
                        prompt1: {
                            entry: [send((context) => ({
                                type: 'SPEAK',
                                value: `Do you want me to create a meeting titled ${context.title} on ${context.day} at ${context.time}?`
                            })),
                            assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt2: {
                            entry: [send((context) => ({
                                type: 'SPEAK',
                                value: `Should I create a meeting called ${context.title} on ${context.day} at ${context.time}?`
                            })),
                            assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt3: {
                            entry: [send((context) => ({
                                type: 'SPEAK',
                                value: `The information I have is a meeting titled ${context.title} on ${context.day} at ${context.time}. Should I create that meeting for you?`
                            })),
                            assign({counter: (context) => context.counter + 1})],
                            on: { ENDSPEECH: 'ask' }
                        },
                        ask: {
                            entry: send('LISTEN'),
                        },
                    }
                },
                info: {
                    entry: send((context) => ({
                        type: 'SPEAK',
                        value: `Your meeting has been created.`
                    })),
                    on: { ENDSPEECH: '#root.dm.init' }
                }
            },
        },
    },
})
