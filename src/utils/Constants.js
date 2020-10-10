module.exports = {
    fantasytypes: {
        classic: 1,
        batting: 2,
        bowling: 3,
        reverse: 4,
        wizard: 5
    },
    txnTypes: {
        leagueJoined: 2,
        leagueJoinedWithTicket: 15,
        leagueJoinedWithPass: 25,
        bonusCashAdded: 18,
        cashDeposited: 6,
        unusedAmount: 12,
        bonousAmount: 13,
        winningAmount: 14,
        withdrawlRequested: 4,
        withdrawlReversed: 7
    },
    txnMessages: {
        leagueJoined: "League Joined",
        leagueJoinedWithTicket: "Joined with ticket",
        leagueJoinedWithPass: "Joined with pass",
        cashDeposited: "Cash Deposited",
        bonusRecived: "Bonus received",
        unusedAmount: "Unused Cash Redeemed",
        bonousAmount: "Bonus Redeemed",
        winningAmount: "Winnings Received ",
        withdrawlRequested: "Withdrawal Requested",
        withdrawlReversed: "Cancelled by user",
        // withdrawlReversed: "Withdrawal Reversed"

    },
    notifyType: {
        cancelledWithdrawlRequest: 7,

    },
    notifyMsg: {
        cancelledWithdrawlRequest: "You have cancelled the withdrawal request submitted by you."
    },
    fantasyTypes: [1, 2, 3, 4, 5],
    tokenExpiry : 360,
    authTypes: [1, 2, 3],
    emails: {
        verifyEmail: 1,
        bankVerifyEmail: 2,
        withdrawRequest: 3,
        cancelWithdrawlRequest: 4,
        joinLeagueMail: 5,
        fundtransferPP: 6,
        paymentGateway: 7,
        rewardClaim: 8
    },
    promoUsagestypes: {
        singleUse: 2,
        firstTimeDeposit: 3,
        maxTimes: 4
    },
    languageTypes: ["en", "hi"],
    bannerTypes: {
        partnerShipBanner: 9
    },
    MIN_PARTNER_AFFILIATE_WITHDRAW: 1,
    accountTypes: {
        facebook: 1,
        google: 2
    },
    SIGNUP_BONUS: 50,
    MIN_AFFILIATE_WITHDRAW: 200,
    APP_VERSION: '2.0',
    DAY_DIFF_FOR_CLAIM_PRODUCT: 1,

    PLAY_TYPE: {
        CRICKET: 1,
        FOOTBALL: 2,
        KABADDI: 3,
        BASKETBALL: 4,
        BASEBALL: 5,
        QUIZ: 6,
    },

    TOTAL_PLAYERS: {
        bk_total_players: 8,
        kb_total_players: 7
    },

    PRIVATE_LEAGUE: {
        MAX_PLAYERS: 1000,
        JOINING_AMOUNT: {
            min: 10,
            max: 10000
        },
        WIN_AMOUNT: {
            min: 10,
            max: 100000
        }

    },
    DEFAULT_USER_RECORDS: {
        total_classic: 0,
        total_classic_kb: 0,
        total_classic_fb: 0,
        total_classic_bs: 0,
        total_classic_bk: 0,
        total_bowling: 0,
        total_batting: 0,
        total_wizard: 0,
        total_reverse: 0,
        total_quiz_joined: 0
    }
}