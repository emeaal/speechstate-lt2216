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

const answer: { [index: string]: { pos?: string, neg?: string} } = {
    "Yes.": { pos: "Yes" },
    "Okay.": { pos: "Yes" },
    "No.": { neg: "No" },
    "Of course.": { pos: "Yes" },
    "No way": { neg: "No" },
    "Absolutely not.": { neg: "No" },
    "Absolutely": { pos: "Yes"},
    "Sure": { pos: "Yes" },
    "Yes please.": { pos: "Yes" },
}

const menugrammar: { [index: string]: {meet?: string, celeb?: string }} = {
    "Create a meeting.": { meet: "Meeting" },
    "I want to create a meeting.": { meet: "Meeting" },
    "Meet a celebrity": { celeb: "celebrity" },
    "Celebrity": { celeb: "celebrity" },
}

const kbRequest = (text: string) =>
    fetch(new Request(`https://cors.eu.org/https://api.duckduckgo.com/?q=${text}&format=json&skip_disambig=1&kl=us_en`)).then(data => data.json())

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
                TTS_READY: 'hello',
                CLICK: 'hello',
            }
        },
        hello: {
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    {
                        target: 'mainmenu',
                        actions: assign({ username: (context) => context.recResult[0].utterance })
                    },
                    ],
                TIMEOUT: '.prompt'
                },
            states: {
                prompt: {
                    entry: say("What is your username?"),
                    on: { ENDSPEECH: 'ask' }
                    },
                    ask: {
                        entry: send('LISTEN'),
                    },
                }
            },
        mainmenu: {
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    {
                        target: 'welcome',
                        cond: (context) => "meet" in (menugrammar[context.recResult[0].utterance] || {}),
                        actions: assign({ meet: (context) => menugrammar[context.recResult[0].utterance].meet!})
                    },
                    {
                        target: 'testermenu',
                        actions: assign({ celeb: (context) => context.recResult[0].utterance })
                    },
                    ],
                TIMEOUT: '.prompt'
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
                    entry: say("What do you want to do?"),
                    on: { ENDSPEECH: 'ask'}
                },
                ask: {
                    entry: send('LISTEN'),
                },
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
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    {
                        target: 'day',
                        cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {}),
                        actions: assign({ pos: (context) => answer[context.recResult[0].utterance].pos! })
                    },
                    {
                        target: 'mainmenu',
                        cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {}),
                        actions: assign({neg: (context) => answer[context.recResult[0].utterance].neg!})
                    },
                    {
                        target: '.nomatch'
                    }
                ],
                TIMEOUT: '.prompt'
            },
            states: {
                prompt: {
                    entry: say("Do you want to meet them?"),
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
        welcome: {
            entry: send((context) => ({
                type: 'SPEAK',
                value: `Let's create a meeting!`,
            })),
            on: { ENDSPEECH: 'regards' }
        },
        regards: {
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    {
                        target: 'day',
                        cond: (context) => "title" in (grammar[context.recResult[0].utterance] || {}),
                        actions: assign({ title: (context) => grammar[context.recResult[0].utterance].title! })
                    },
                    {
                        target: '.nomatch'
                    }
                ],
                TIMEOUT: '.prompt'
            },
            states: {
                prompt: {
                    entry: say("What is it about?"),
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
        day: {
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    {
                        target: 'durance',
                        cond: (context) => "day" in (grammar[context.recResult[0].utterance] || {}),
                        actions: assign({ day: (context) => grammar[context.recResult[0].utterance].day! })
                    },
                    {
                        target: '.nomatch'
                    }
                ],
                TIMEOUT: '.prompt'
            },
            states: {
                prompt: {
                    entry: say("On which day is it?"),
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
        durance: {
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    {
                        target: 'creationwholeday',
                        cond: (context) => "pos" in (answer[context.recResult[0].utterance] || {}),
                        actions: assign({ pos: (context) => answer[context.recResult[0].utterance].pos! })
                    },
                    {
                        target: 'time',
                        cond: (context) => "neg" in (answer[context.recResult[0].utterance] || {}),
                        actions: assign({ neg: (context) => answer[context.recResult[0].utterance].neg! })
                    },
                    {
                        target: '.nomatch'
                    }
                ],
                TIMEOUT: '.prompt'
            },
            states: {
                prompt: {
                    entry: say("Will it take the whole day?"),
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
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    {
                        target: 'creation_with_time',
                        cond: (context) => "time" in (grammar[context.recResult[0].utterance] || {}),
                        actions: assign({ time: (context) => grammar[context.recResult[0].utterance].time! })
                    },
                    {
                        target: '.nomatch'
                    }
                ],
                TIMEOUT: '.prompt'
            },
            states: {
                prompt: {
                    entry: say("What time is your meeting?"),
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
            initial: 'prompt',
            on: {
                RECOGNISED: [
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
                TIMEOUT: '.prompt'
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: 'SPEAK',
                        value: `Do you want me to create a meeting titled ${context.title} on ${context.day}?`
                    })),
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
            initial: 'prompt',
            on: {
                RECOGNISED: [
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
                TIMEOUT: '.prompt'
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: 'SPEAK',
                        value: `Do you want me to create a meeting titled ${context.title} on ${context.day} at ${context.time}?`
                    })),
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
            on: { ENDSPEECH: 'init' }
        }
    },
})
