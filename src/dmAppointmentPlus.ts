import { MachineConfig, send, Action, assign, Machine } from "xstate";

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
    "Okay.": { pos: "Yes" },
    "No.": { neg: "No" },
    "Of course.": { pos: "Yes" },
    "No way": { neg: "No" },
    "Absolutely not.": { neg: "No" },
    "Absolutely": { pos: "Yes"},
    "Sure": { pos: "Yes" },
    "Yes please.": { pos: "Yes" },
    "Help.": { help: "Help" },
    "I need help.": { help: "Help" },
    "What do I do?": { help: "Help" },
}

const menugrammar: { [index: string]: {meet?: string, celeb?: string, intent?: string }} = {
    "Create a meeting.": { meet: "Meeting" },
    "I want to create a meeting.": { meet: "Meeting" },
    "Meet a celebrity.": { celeb: "celebrity" },
    "Celebrity.": { celeb: "celebrity" },
    "Search for someone.": { celeb: "celebrity" },
    "Search for a celebrity": { celeb: "celebrity" },
    "Intent.": {intent: "intent" },
}

const intents: {[index: string]: {intent?: string}} = {
    "Vaccuum": {intent: "Vaccuum" },
    "vacuum": {intent: "vacuum"},
    "Hello.": {intent: "Hello"},
    "Bye.": {intent: "Bye"},
}

const kbRequest = (text: string) =>
    fetch(new Request(`https://cors.eu.org/https://api.duckduckgo.com/?q=${text}&format=json&skip_disambig=1&kl=us_en`)).then(data => data.json())

const rasaurl = 'https://intentrecog.herokuapp.com/model/parse'
const nluRequest = (text: string) =>
  fetch(new Request(rasaurl, {
      method: 'POST',
      body: `{"text": "${text}"}`
  }))
      .then(data => data.json());


function promptAndask(prompt1: string, prompt2: string, prompt3: string, notmatched: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt1',
        entry: assign({counter: (context) => context.counter = 0}),
        on: {
            RECOGNISED: [
                {
                    target: '#root.dm.getHelp',
                    cond: (context) => "help" in (answer[context.recResult[0].utterance] || {}),
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
            prompt1: {
                entry: [say(prompt1), assign({counter: (context) => context.counter +1})],
                on: { ENDSPEECH: 'ask'}
            },
            prompt2: {
                entry: [say(prompt2), assign({counter: (context) => context.counter +1})],
                on: {ENDSPEECH: 'ask'}
            },
            prompt3: {
                entry: [say(prompt3), assign({counter: (context) => context.counter +1})],
                on: { ENDSPEECH: 'ask' }
            },
            nomatch: {
                entry: say(notmatched),
                on: { ENDSPEECH: 'ask' }
                },
            ask: {
                entry: send('LISTEN'),
            }
        },
    })
}


const confid_threshold = 0.6  // confidence threshold set to 0.6, if below this, speech wont be recognized
// maybe look into number on threshold

//const increment = (context: { count: number; }) => context.count + 1;



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
                    entry: say("This is a help message for those who need help."),
                    on: { ENDSPEECH: '#root.dm.createAppointment.hist' } // returns to same state as before help was called
                }
            }
        },
        confirmquestion: {
            initial: 'prompt1',
        on: {
            RECOGNISED: [
                {
                target: '#root.dm.createAppointment.hist', 
                cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                //actions: assign()
                },
                {
                target: '#root.dm.createAppointment.hello',
                cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                }
            ],
        },
        states: {
            prompt1: {
                entry: send((context) => ({
                    type: 'SPEAK',
                    value: `Did you mean to say ${context.recResult[0].utterance}?`
                })),
                on: { ENDSPEECH: 'ask' },
            },
            ask: {
                entry: send('LISTEN'),
            },
        },
    },
        createAppointment: {
            initial: 'hello',
            states: {
                hist: {
                    type: 'history',
                },
                hello: {
                    initial: 'prompt',
                    entry: assign({counter: (context) => context.counter = 0}),
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => "help" in (answer[context.recResult[0].utterance] || {}),
                            },
                            {
                                target: 'mainmenu',
                                cond: (context) => context.counter < 3 && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ username: (context) => context.recResult[0].utterance })
                            },
                            {
                                target: '#root.dm.confirmquestion',
                                cond: (context) => context.recResult[0].confidence < confid_threshold,
                                actions: assign({ username: (context) => context.recResult[0].utterance })
                            },
                            {
                                target: '.nomatch'
                            }
                            ],
                        TIMEOUT: [
                            {
                                target: '.prompt',
                                cond: (context) => context.counter < 3,
                            },
                            {
                                target: '#root.dm.init',
                                cond: (context) => context.counter === 3,
                            }
                        ]
                        },
                    states: {
                        prompt: {
                            entry: [say("What is your username?"), assign({counter: (context) => context.counter +1})],
                            on: { ENDSPEECH: 'ask' }
                            },
                            ask: {
                                entry: send('LISTEN'),
                            },
                            nomatch: {
                                entry: say("Sorry, I don't know what it is. Tell me something I know."),
                                on: { ENDSPEECH: 'ask' }
                            }
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
                                target: '#root.dm.confirmquestion',
                                cond: (context) => context.recResult[0].confidence < confid_threshold,
                            },
                            {
                                target: 'welcome',
                                cond: (context) => "meet" in (menugrammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ meet: (context) => menugrammar[context.recResult[0].utterance].meet!})
                            },
                            {
                                target: 'searchceleb',
                                cond: (context) => "celeb" in (menugrammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ celeb: (context) => menugrammar[context.recResult[0].utterance].celeb!})
                            },
                            {
                                target: 'lookforintent',
                                cond: (context) => "intent" in (menugrammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ intent: (context) => menugrammar[context.recResult[0].utterance].intent!})
                            },
                            {
                                target: '.nomatch'
                            }
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
                        ask: {
                            entry: send('LISTEN'),
                        },
                        nomatch: {
                            entry: say("Sorry, I don't know what it is. Tell me something I know."),
                            on: { ENDSPEECH: 'ask' }
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
                                target: '#root.dm.confirmquestion',
                                cond: (context) => context.recResult[0].confidence < confid_threshold,
                            },
                            {
                                target: 'lookupCeleb',
                                cond: (context) => context.recResult[0].confidence > confid_threshold,
                                actions: assign({ celeb: (context) => context.recResult[0].utterance })
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
                            entry: [say("Who are you searching for?"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt2: {
                            entry: [say("Please tell me who you are searching for"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt3: {
                            entry: [say("Tell me the name of a celebrity and I will look them up for you"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        ask: {
                            entry: send('LISTEN'),
                        },
                        nomatch: {
                            entry: say("Sorry, I don't know who that is"),
                            on: { ENDSPEECH: 'ask' }
                        }
                    }
                },
                lookupCeleb: {
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
                do_intent: {
                    initial: 'prompt1',
                    entry: assign({counter: (context) => context.counter = 0}),
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => "help" in (answer[context.recResult[0].utterance] || {}),
                            },
                            {
                                target: '#root.dm.confirmquestion',
                                cond: (context) => context.recResult[0].confidence < confid_threshold,
                            },
                            {
                                target: 'lookforintent',
                                cond: (context) => context.recResult[0].confidence > confid_threshold,
                                actions: assign({ celeb: (context) => context.recResult[0].utterance })
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
                            entry: [say("What can I help you with?"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt2: {
                            entry: [say("Please say something I can assist you with"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt3: {
                            entry: [say("Tell me something I can do for you in your home"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        ask: {
                            entry: send('LISTEN'),
                        },
                        nomatch: {
                            entry: say("Sorry, I don't know what that is"),
                            on: { ENDSPEECH: 'ask' }
                        }
                    }
                },
                lookforintent: {
                    invoke: {
                        id: 'IntentRecognizer',
                        src: (context, event) => nluRequest(context.recResult[0].utterance),
                        onDone: {
                            target: 'intentsuccess', //see actions index.tsx
                            actions: [(context, event) => console.log(context, event), assign({ title: (context) => intents[context.intent].intent! })]
                                        },
                        onError: {
                            target: 'intentfailure',
                        },
                    },
                },
                intentsuccess: {
                    entry: send((context) => ({
                        type: 'SPEAK',
                        value: `OK, ${context.title} will be started now`
                    })),
                    on: { ENDSPEECH: '...init' }
                },
                intentfailure: {
                    entry: send((context) => ({
                        type: 'SPEAK',
                        value: `${context.intent} couldn't be done`,
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
                                target: '#root.dm.confirmquestion',
                                cond: (context) => context.recResult[0].confidence < confid_threshold,
                            },
                            {
                                target: 'day',
                                cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ pos: (context) => answer[context.recResult[0].utterance].pos! })
                            },
                            {
                                target: 'mainmenu',
                                cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({neg: (context) => answer[context.recResult[0].utterance].neg!})
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
                            entry: [say("Do you want to meet them?"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt2: {
                            entry: [say("Do you want to meet this celebrity?"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt3: {
                            entry: [say("Do you want to create a meeting with this person?"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        ask: {
                            entry: send('LISTEN'),
                        },
                        nomatch: {
                            entry: say("Sorry, I don't know what it is. Tell me something I know."),
                            on: { ENDSPEECH: 'ask' }
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
                                target: '#root.dm.confirmquestion',
                                cond: (context) => context.recResult[0].confidence < confid_threshold,
                            },
                            {
                                target: 'day',
                                cond: (context) => "title" in (grammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
                                actions: assign({ title: (context) => grammar[context.recResult[0].utterance].title! })
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
                            entry: [say("What is it about?"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt2: {
                            entry: [say("What is your meeting about?"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt3: {
                            entry: [say("What should your meeting be called?"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        ask: {
                            entry: send('LISTEN'),
                        },
                        nomatch: {
                            entry: say("Sorry, I didn't understand what you said. Try again, please."),
                            on: { ENDSPEECH: 'ask' }
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
                                target: '#root.dm.confirmquestion',
                                cond: (context) => context.recResult[0].confidence < confid_threshold,
                            },
                            {
                                target: 'durance',
                                cond: (context) => "day" in (grammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
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
                            entry: [say("On which day is it?"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt2: {
                            entry: [say("On which day will this meeting take place?"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        prompt3: {
                            entry: [say("Please tell me the day of this meeting"), assign({counter: (context) => context.counter + 1}), ],
                            on: { ENDSPEECH: 'ask' }
                        },
                        ask: {
                            entry: send('LISTEN'),
                        },
                        nomatch: {
                            entry: say("Sorry, what did you say?"),
                            on: { ENDSPEECH: 'ask' }
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
                                target: '#root.dm.confirmquestion',
                                cond: (context) => context.recResult[0].confidence < confid_threshold,
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
                        nomatch: {
                            entry: say("Sorry, I don't know what it is. Tell me something I know."),
                            on: { ENDSPEECH: 'ask' }
                        }
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
                                target: '#root.dm.confirmquestion',
                                cond: (context) => context.recResult[0].confidence < confid_threshold,
                            },
                            {
                                target: 'creation_with_time',
                                cond: (context) => "time" in (grammar[context.recResult[0].utterance] || {}) && context.recResult[0].confidence > confid_threshold,
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
                                target: '#root.dm.confirmquestion',
                                cond: (context) => context.recResult[0].confidence < confid_threshold,
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
                        nomatch: {
                            entry: say("Sorry, I don't know what it is. Tell me something I know."),
                            on: { ENDSPEECH: 'ask' }
                        }
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
                                target: '#root.dm.confirmquestion',
                                cond: (context) => context.recResult[0].confidence < confid_threshold,
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
                        nomatch: {
                            entry: say("Sorry, I don't know what it is. Tell me something I know."),
                            on: { ENDSPEECH: 'ask' }
                        }
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
