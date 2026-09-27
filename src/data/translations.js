const translations = {
    en: {
        languageName: 'English',
        language: 'Language',
        readAloud: 'Read Aloud',
        stopReading: 'Stop Reading',
        caregiver: 'Caregiver',
        elderlyUser: 'Elderly User',
        logout: 'Logout',

        dashboard: 'Dashboard',

        greetingMorning: 'Good morning',
        greetingAfternoon: 'Good afternoon',
        greetingEvening: 'Good evening',

        cognitiveGames: 'Cognitive Games',
        cognitiveGamesDescription:
            'Exercise your mind with fun puzzles and games.',
        playNow: 'Play Now',

        performance: 'My Performance',
        performanceDescription:
            'View your recent cognitive game performance.',
        viewPerformance: 'View Performance',

        caregiverDashboard: 'Caregiver Dashboard',
        caregiverDashboardDescription:
            'Review recent cognitive activity and performance.',
        openCaregiverDashboard:
            'Open Caregiver Dashboard',

        caregiverConnections: 'Caregiver Connections',
        caregiverConnectionsDescription:
            'Connect with an elderly user and manage your caregiver relationships.',
        manageConnections: 'Manage Connections',

        caregiverRequests: 'Caregiver Requests',
        caregiverRequestsDescription:
            'Review and manage caregiver connection requests.',
        viewRequests: 'View Requests',

        memories: 'Memories',
        memoriesDescription:
            'Save and revisit important moments and stories.',
        openMemories: 'Open Memories',

        myMemories: 'My Memories',
        myMemoriesDescription:
            'View your photos and cherished moments.',
        viewMemories: 'View Memories',

        reminders: 'Reminders',
        remindersDescription:
            'Keep track of important activities and tasks.',
        openReminders: 'Open Reminders',

        todaysReminders: "Today's Reminders",
        todaysRemindersDescription:
            'Your tasks and reminders for today.',
        seeAllReminders: 'See All Reminders',

        caregiverHelp: 'Caregiver Help',
        caregiverHelpDescription:
            'Contact your caregiver or get help anytime.',
        getHelp: 'Get Help',

        online:
            'Online — your data will sync normally.',
        offline:
            'Offline — your game results will be saved and synced when you reconnect.',

        back: 'Back',

        footer:
            'Cognicare NER — SIH 2025 Prototype',

        gamesPage: {
            icon: '🧠',
            title: 'Cognitive Games',
            subtitle:
                'Choose a game to exercise your mind, Mrs. Das.',
            backButton: 'Back to Dashboard',

            games: [
                {
                    id: 'memory-match',
                    icon: '🃏',
                    title: 'Memory Match',
                    description:
                        'Flip cards and find matching pairs to train your memory.',
                    button: 'Coming Soon',
                },
                {
                    id: 'sequence-memory',
                    icon: '🔢',
                    title: 'Sequence Memory',
                    description:
                        'Remember and repeat the sequence of numbers or colors.',
                    button: 'Coming Soon',
                },
                {
                    id: 'object-recall',
                    icon: '👁️',
                    title: 'Object Recall',
                    description:
                        'Look at objects, then recall what you saw.',
                    button: 'Coming Soon',
                },
            ],
        },

        performancePage: {
            backToDashboard: 'Back to Dashboard',
            performanceDashboard: 'Performance Dashboard',
            performancePageDescription:
                'Review your recent cognitive game performance.',
            loadingPerformance:
                'Loading performance data...',
            totalSessions: 'Total Sessions',
            gamesPlayed: 'Games Played',
            averageAccuracy: 'Average Accuracy',
            averageTime: 'Average Time',
            averageMistakes: 'Average Mistakes',
            mostPlayedGame: 'Most Played Game',
            recentSessions: 'Recent Sessions',
            performanceDataSource:
                'Data loaded from your account through FastAPI and PostgreSQL.',
            noSessions:
                'No game sessions recorded yet.',
            difficulty: 'Difficulty',
            accuracy: 'Accuracy',
            mistakes: 'Mistakes',
            time: 'Time',
            performanceTrend: 'Performance Trend',
            trendImproving: 'Improving',
            trendNeedsPractice: 'Needs Practice',
            trendStable: 'Stable',
            accuracyChangeOverTime: 'Accuracy Change Over Time',
            personalBestAccuracy: 'Personal Best Accuracy',
            bestPerformanceByGame: 'Best Performance by Game',
            gameWisePerformance: 'Game-wise Performance',
            accuracyDistribution: 'Accuracy Distribution',
            excellentAccuracy: '90–100% Accuracy',
            goodAccuracy: '70–89% Accuracy',
            averageAccuracyRange: '50–69% Accuracy',
            below50Accuracy: 'Below 50% Accuracy',
            difficultyWisePerformance: 'Difficulty-wise Performance',
            timeWisePerformance: 'Time-wise Performance',
            analyticsSummary: 'Analytics Summary',
            analyticsSummaryNoData: 'No performance data is available yet.',
            analyticsSummaryMessage: 'You have completed {sessions} sessions with an average accuracy of {accuracy}%. Your recent performance trend is {trend}. Your most played game is {game}.',
            weeklyActivity: 'Weekly Activity',
            noAccuracyHistory: 'No accuracy history available yet.',
            startingSession: 'Starting session',

        },

        memoriesPage: {
            backToDashboard: 'Back to Dashboard',
            memoriesTitle: 'Memories',
            memoriesDescription:
                'Save important moments, stories, and people you want to remember.',

            editMemory: 'Edit Memory',
            addMemory: 'Add a Memory',

            title: 'Title',
            description: 'Description',
            category: 'Category',
            memoryDate: 'Memory Date',

            titlePlaceholder:
                'e.g. Family trip to Agra',
            descriptionPlaceholder:
                'Write about this memory...',

            saving: 'Saving...',
            updateMemory: 'Update Memory',
            saveMemory: 'Save Memory',
            cancelEdit: 'Cancel Edit',

            savedMemories: 'Saved Memories',
            savedMemoriesDescription:
                'Your memories are stored securely in your account.',

            memory: 'memory',
            memoriesPlural: 'memories',

            loadingMemories: 'Loading memories...',
            noMemories:
                'No memories have been saved yet.',

            edit: 'Edit',
            delete: 'Delete',

            noDate: 'No date provided',

            validationError:
                'Please enter both a title and description.',
            loadError:
                'Could not load memories from the server.',
            saveError:
                'Could not save the memory.',
            deleteError:
                'Could not delete the memory.',

            saveSuccess:
                'Memory saved successfully.',
            updateSuccess:
                'Memory updated successfully.',
            deleteSuccess:
                'Memory deleted successfully.',

            deleteConfirm:
                'Are you sure you want to delete this memory?',

            categories: {
                General: 'General',
                Family: 'Family',
                Friends: 'Friends',
                Travel: 'Travel',
                Celebration: 'Celebration',
                Childhood: 'Childhood',
                Other: 'Other',
            },
        },

        remindersPage: {
            backToDashboard: 'Back to Dashboard',
            remindersTitle: 'Reminders',
            remindersDescription:
                'Keep track of important activities, appointments, and daily tasks.',

            editReminder: 'Edit Reminder',
            addReminder: 'Add a Reminder',

            title: 'Title',
            description: 'Description',
            category: 'Category',
            dueDateTime: 'Due Date & Time',

            titlePlaceholder:
                'e.g. Family video call',
            descriptionPlaceholder:
                'What should be remembered?',

            markCompleted: 'Mark as completed',

            saving: 'Saving...',
            updateReminder: 'Update Reminder',
            saveReminder: 'Save Reminder',
            cancelEdit: 'Cancel Edit',

            savedReminders: 'Saved Reminders',
            savedRemindersDescription:
                'Your reminders are stored securely in your account.',

            reminder: 'reminder',
            remindersPlural: 'reminders',

            loadingReminders:
                'Loading reminders...',
            noReminders:
                'No reminders have been saved yet.',

            completed: 'Completed',
            overdue: 'Overdue',

            markActive: 'Mark Active',
            markComplete: 'Mark Complete',
            edit: 'Edit',
            delete: 'Delete',

            noDueDate: 'No due date',

            validationError:
                'Please enter both a title and description.',
            loadError:
                'Could not load reminders from the server.',
            saveError:
                'Could not save the reminder.',
            updateError:
                'Could not update the reminder.',
            deleteError:
                'Could not delete the reminder.',

            saveSuccess:
                'Reminder saved successfully.',
            updateSuccess:
                'Reminder updated successfully.',
            deleteSuccess:
                'Reminder deleted successfully.',
            completeSuccess:
                'Reminder marked as completed.',
            markActiveSuccess:
                'Reminder marked as active.',

            deleteConfirm:
                'Are you sure you want to delete this reminder?',

            categories: {
                General: 'General',
                Family: 'Family',
                Appointment: 'Appointment',
                Medication: 'Medication',
                Activity: 'Activity',
                Personal: 'Personal',
                Other: 'Other',
            },
        },
        caregiverPage: {
            backToDashboard: 'Back to Dashboard',
            caregiverDashboardTitle: 'Caregiver Dashboard',
            caregiverDashboardDescription:
                'Review recent cognitive activity and important daily information.',

            currentlyViewing: 'Currently viewing',

            loadingCaregiverData:
                'Loading caregiver data...',

            caregiverOnlyError:
                'Caregiver Dashboard is available only for caregiver accounts.',

            loadError:
                'Could not load caregiver dashboard.',

            noApprovedConnection:
                'No approved elderly connection',

            noApprovedConnectionDescription:
                'Connect with an elderly user and wait for their approval before viewing their Cognicare information.',

            totalSessions: 'Total Sessions',
            gamesPlayed: 'Games Played',
            averageAccuracy: 'Average Accuracy',
            savedMemories: 'Saved Memories',
            activeReminders: 'Active Reminders',
            averageMistakes: 'Average Mistakes',
            averageCompletionTime: 'Average Completion Time',
            personalBestAccuracy: 'Personal Best Accuracy',
            weeklyActivity: 'Weekly Activity',

            connectedUser: 'Connected User',
            connectedUserDescription:
                'You are viewing cognitive activity, memories, and reminders belonging to your approved elderly connection.',

            gamePerformance: 'Game Performance',

            games: {
                memoryMatch: 'Memory Match',
                sequenceMemory: 'Sequence Memory',
                objectRecall: 'Object Recall',
            },

            session: 'session',
            sessions: 'sessions',

            trend: 'Trend',
            recent: 'Recent',

            notEnoughData: 'Not enough data',
            improving: 'Improving',
            declining: 'Declining',
            stable: 'Stable',

            planning: 'Planning',

            upcomingReminders: 'Upcoming Reminders',

            upcomingRemindersDescription:
                'The next active reminders for the connected elderly user.',

            noUpcomingReminders:
                'No upcoming active reminders.',

            recentActivity: 'Recent Activity',

            noSessionsRecorded:
                'No sessions recorded yet.',

            game: 'Game',
            difficulty: 'Difficulty',
            accuracy: 'Accuracy',
            mistakes: 'Mistakes',
            time: 'Time',
            date: 'Date',

            noDueDate: 'No due date',
            unknown: 'Unknown',
        },

        caregiverLinksPage: {
            backToDashboard: 'Back to Dashboard',

            connections: 'Connections',

            caregiverConnections:
                'Caregiver Connections',

            caregiverRequests:
                'Caregiver Requests',

            caregiverConnectionsDescription:
                'Connect with an elderly user to support their Cognicare journey.',

            caregiverRequestsDescription:
                'Review and manage caregiver connection requests.',

            newConnection: 'New Connection',

            connectWithElderly:
                'Connect with an Elderly User',

            connectWithElderlyDescription:
                "Enter the elderly user's registered Cognicare email address to send a connection request.",

            elderlyUserEmail:
                'Elderly User Email',

            emailValidation:
                'Please enter the elderly user email address.',

            sending: 'Sending...',
            sendRequest: 'Send Request',

            requestSent:
                'Link request sent successfully.',

            sendError:
                'Could not send the link request.',

            yourRequests: 'Your Requests',
            incomingRequests: 'Incoming Requests',

            connectionStatus: 'Connection Status',

            loading: 'Loading...',
            refresh: 'Refresh',

            loadingConnections:
                'Loading connections...',

            noCaregiverConnections:
                'No caregiver connections yet',

            noCaregiverRequests:
                'No caregiver requests yet',

            noConnectionsDescription:
                'Send a request using the elderly user’s registered email address.',

            noRequestsDescription:
                'New caregiver requests will appear here.',

            email: 'Email',

            approve: 'Approve',
            reject: 'Reject',
            remove: 'Remove',

            statusApproved: 'Approved',
            statusRejected: 'Rejected',
            statusPending: 'Pending',

            connectedWith: 'You are connected with',
            connectedToYourAccount:
                'is connected to your account.',

            rejectedRequest:
                'rejected this request.',

            youRejected: 'You rejected',
            request: 'request',

            waitingFor: 'Waiting for',
            toRespond: 'to respond.',

            requestingToConnect:
                'is requesting to connect with you.',

            requestApproved:
                'Caregiver request approved.',

            requestRejected:
                'Caregiver request rejected.',

            updateError:
                'Could not update the caregiver request.',

            connectionRemoved:
                'Caregiver connection removed.',

            removeError:
                'Could not remove the connection.',

            dataProtected:
                'Your data stays protected',

            dataProtectedDescription:
                'A caregiver only becomes connected after the elderly user approves the request. The connection can also be removed later.',
        },

        memoryMatchPage: {
            backToGames: 'Back to Games',
            title: 'Memory Match',

            description:
                'Find all the matching pairs. Take your time and enjoy the game.',

            gameStatistics: 'Game statistics',
            moves: 'Moves',
            matches: 'Matches',
            mistakes: 'Mistakes',
            time: 'Time',
            accuracy: 'Accuracy',

            gameBoard: 'Memory match game board',
            cardShowing: 'Card showing',
            hiddenCard: 'Hidden memory card',

            wellDone: 'Well Done!',

            completedMessage: (moves) =>
                `You found all the pairs in ${moves} moves.`,

            playAgain: 'Play Again',
            restartGame: 'Restart Game',

            previousSessions: 'Previous Sessions',
            recentResults:
                'Your recent Memory Match results.',

            clearHistory: 'Clear History',

            localHistoryNote:
                'History is currently saved only on this device.',
        },

        sequenceMemoryPage: {
            backToGames: 'Back to Games',
            title: 'Sequence Memory',

            description:
                'Remember the order of the objects and select them in the same order.',

            chooseDifficulty:
                'Choose a difficulty to begin.',

            rememberSequence:
                'Remember this sequence...',

            selectSameOrder:
                'Now select the objects in the same order.',

            notQuite:
                'Not quite. Take your time and try the next one.',

            excellent:
                '🎉 Excellent! You remembered the sequence.',

            selectDifficulty:
                'Select Difficulty',

            startGame:
                'Start Game',

            playAgain:
                'Play Again',

            items: 'Items',
            mistakes: 'Mistakes',
            time: 'Time',
            accuracy: 'Accuracy',

            sequenceToRemember:
                'Sequence to remember',

            sequenceChoices:
                'Sequence choices',

            wellDone:
                'Well Done!',

            completeDescription:
                'You remembered the complete sequence.',

            difficulty:
                'Difficulty',

            previousSessions:
                'Previous Sessions',

            recentResults:
                'Your recent Sequence Memory results.',

            clearHistory:
                'Clear History',

            localHistoryNote:
                'History is currently saved only on this device.',

            difficulties: {
                Easy: 'Easy',
                Medium: 'Medium',
                Hard: 'Hard',
            },
        },

        objectRecallPage: {
            backToGames: 'Back to Games',
            title: 'Object Recall',
            description:
                'Remember the objects you see, then select them from the choices.',
            chooseDifficulty:
                'Choose a difficulty to begin.',
            rememberObjects:
                'Remember these objects...',
            whichObjects:
                'Which objects did you see?',
            goodChoice:
                'Good choice! Keep going.',
            wrongObject:
                'That was not one of the objects. Keep trying.',
            excellent:
                '🎉 Excellent! You remembered all the objects.',
            selectDifficulty:
                'Select Difficulty',
            startGame:
                'Start Game',
            playAgain:
                'Play Again',
            objects: 'Objects',
            correct: 'Correct',
            wrong: 'Wrong',
            time: 'Time',
            accuracy: 'Accuracy',
            objectsToRemember:
                'Objects to remember',
            objectChoice:
                'Object choice',
            wellDone: 'Well Done!',
            completedMessage: (count) =>
                `You remembered all ${count} objects.`,
            difficulty: 'Difficulty',
            previousSessions: 'Previous Sessions',
            recentResults:
                'Your recent Object Recall results.',
            clearHistory: 'Clear History',
            localHistoryNote:
                'History is currently saved only on this device.',
            difficulties: {
                Easy: 'Easy',
                Medium: 'Medium',
                Hard: 'Hard',
            },
        },

        recommendationPage: {
            title: 'Personalized Recommendation',
            analyzing:
                'Analyzing your recent performance...',

            unavailable:
                'Recommendation is currently unavailable.',

            noRecommendation:
                'No recommendation available yet.',

            suggestedDifficulty:
                'Suggested difficulty:',

            basedOn: 'Based on',

            session: 'session',
            sessions: 'sessions',

            startRecommendedGame:
                'Start Recommended Game',

            hideDetails:
                'Hide recommendation details',

            whyRecommendation:
                'Why this recommendation?',

            recentAccuracy:
                'Recent accuracy',

            overallAccuracy:
                'Overall accuracy',

            mistakesPerSession:
                'Mistakes per session',

            performanceTrend:
                'Performance trend',

            sessionsAnalyzed:
                'Sessions analyzed',

            recommendationExplanation:
                'The recommendation is based on your recent game performance, mistakes, and performance trend.',

            improving: 'Improving',
            declining: 'Declining',
            stable: 'Stable',
            notEnoughData: 'Not enough data',

            games: {
                memoryMatch: 'Memory Match',
                sequenceMemory: 'Sequence Memory',
                objectRecall: 'Object Recall',
            },
        },

        authPage: {
            language: 'Language',

            signInSubtitle:
                'Sign in to continue',

            createAccountSubtitle:
                'Create your Cognicare account',

            fullName: 'Full Name',

            fullNamePlaceholder:
                'Enter your full name',

            email: 'Email',

            emailPlaceholder:
                'Enter your email',

            password: 'Password',

            passwordPlaceholder:
                'Enter your password',

            accountType:
                'Account Type',

            elderlyUser:
                'Elderly User',

            caregiver:
                'Caregiver',

            pleaseWait:
                'Please wait...',

            signIn:
                'Sign In',

            createAccount:
                'Create Account',

            createAccountPrompt:
                "Don't have an account? Create one",

            signInPrompt:
                'Already have an account? Sign in',

            accountCreated:
                'Account created successfully. You can now log in.',

            genericError:
                'Something went wrong. Please try again.',
        },
    },

    hi: {
        languageName: 'हिन्दी',
        language: 'भाषा',
        readAloud: 'पढ़कर सुनाएँ',
        stopReading: 'पढ़ना बंद करें',
        caregiver: 'देखभालकर्ता',
        elderlyUser: 'बुज़ुर्ग उपयोगकर्ता',
        logout: 'लॉग आउट',

        dashboard: 'डैशबोर्ड',

        greetingMorning: 'सुप्रभात',
        greetingAfternoon: 'नमस्कार',
        greetingEvening: 'शुभ संध्या',

        cognitiveGames: 'मानसिक खेल',
        cognitiveGamesDescription:
            'मज़ेदार पहेलियों और खेलों से अपने दिमाग का अभ्यास करें।',
        playNow: 'अभी खेलें',

        performance: 'मेरा प्रदर्शन',
        performanceDescription:
            'अपने हाल के मानसिक खेल के प्रदर्शन को देखें।',
        viewPerformance: 'प्रदर्शन देखें',

        caregiverDashboard: 'देखभालकर्ता डैशबोर्ड',
        caregiverDashboardDescription:
            'हाल की मानसिक गतिविधि और प्रदर्शन की समीक्षा करें।',
        openCaregiverDashboard:
            'देखभालकर्ता डैशबोर्ड खोलें',

        caregiverConnections: 'देखभालकर्ता कनेक्शन',
        caregiverConnectionsDescription:
            'किसी बुज़ुर्ग उपयोगकर्ता से जुड़ें और देखभालकर्ता संबंध प्रबंधित करें।',
        manageConnections: 'कनेक्शन प्रबंधित करें',

        caregiverRequests: 'देखभालकर्ता अनुरोध',
        caregiverRequestsDescription:
            'देखभालकर्ता कनेक्शन अनुरोध देखें और प्रबंधित करें।',
        viewRequests: 'अनुरोध देखें',

        memories: 'यादें',
        memoriesDescription:
            'महत्वपूर्ण पलों और कहानियों को सहेजें और फिर से देखें।',
        openMemories: 'यादें खोलें',

        myMemories: 'मेरी यादें',
        myMemoriesDescription:
            'अपनी तस्वीरें और प्यारे पल देखें।',
        viewMemories: 'यादें देखें',

        reminders: 'रिमाइंडर',
        remindersDescription:
            'महत्वपूर्ण गतिविधियों और कार्यों पर नज़र रखें।',
        openReminders: 'रिमाइंडर खोलें',

        todaysReminders: 'आज के रिमाइंडर',
        todaysRemindersDescription:
            'आज के आपके कार्य और रिमाइंडर।',
        seeAllReminders: 'सभी रिमाइंडर देखें',

        caregiverHelp: 'देखभालकर्ता सहायता',
        caregiverHelpDescription:
            'अपने देखभालकर्ता से संपर्क करें या कभी भी सहायता प्राप्त करें।',
        getHelp: 'सहायता प्राप्त करें',

        online:
            'ऑनलाइन — आपका डेटा सामान्य रूप से सिंक होगा।',
        offline:
            'ऑफलाइन — आपके खेल के परिणाम सुरक्षित रहेंगे और इंटरनेट आने पर सिंक हो जाएंगे।',

        back: 'वापस',

        footer:
            'Cognicare NER — SIH 2025 प्रोटोटाइप',

        gamesPage: {
            icon: '🧠',
            title: 'मानसिक खेल',
            subtitle:
                'अपने दिमाग का अभ्यास करने के लिए एक खेल चुनें, श्रीमती दास।',
            backButton: 'डैशबोर्ड पर वापस जाएँ',

            games: [
                {
                    id: 'memory-match',
                    icon: '🃏',
                    title: 'मेमोरी मैच',
                    description:
                        'कार्ड पलटें और अपनी याददाश्त का अभ्यास करने के लिए समान जोड़े खोजें।',
                    button: 'जल्द आ रहा है',
                },
                {
                    id: 'sequence-memory',
                    icon: '🔢',
                    title: 'सीक्वेंस मेमोरी',
                    description:
                        'संख्याओं या रंगों के क्रम को याद करें और दोहराएँ।',
                    button: 'जल्द आ रहा है',
                },
                {
                    id: 'object-recall',
                    icon: '👁️',
                    title: 'ऑब्जेक्ट रिकॉल',
                    description:
                        'वस्तुओं को देखें और फिर याद करें कि आपने क्या देखा।',
                    button: 'जल्द आ रहा है',
                },
            ],
        },

        performancePage: {
            backToDashboard: 'डैशबोर्ड पर वापस जाएँ',
            performanceDashboard: 'प्रदर्शन डैशबोर्ड',
            performancePageDescription:
                'अपने हाल के मानसिक खेल के प्रदर्शन की समीक्षा करें।',
            loadingPerformance:
                'प्रदर्शन डेटा लोड हो रहा है...',
            totalSessions: 'कुल सत्र',
            gamesPlayed: 'खेले गए खेल',
            averageAccuracy: 'औसत सटीकता',
            averageTime: 'औसत समय',
            averageMistakes: 'औसत गलतियाँ',
            mostPlayedGame: 'सबसे अधिक खेला गया गेम',
            recentSessions: 'हाल के सत्र',
            performanceDataSource:
                'डेटा आपके खाते से FastAPI और PostgreSQL के माध्यम से लोड किया गया है।',
            noSessions:
                'अभी तक कोई गेम सत्र रिकॉर्ड नहीं हुआ है।',
            difficulty: 'कठिनाई',
            accuracy: 'सटीकता',
            mistakes: 'गलतियाँ',
            time: 'समय',
            performanceTrend: 'प्रदर्शन रुझान',
            trendImproving: 'सुधार हो रहा है',
            trendNeedsPractice: 'अभ्यास की आवश्यकता है',
            trendStable: 'स्थिर',
            accuracyChangeOverTime: 'समय के साथ सटीकता में बदलाव',
            personalBestAccuracy: 'व्यक्तिगत सर्वश्रेष्ठ सटीकता',
            bestPerformanceByGame: 'गेम के अनुसार सर्वश्रेष्ठ प्रदर्शन',
            gameWisePerformance: 'गेम के अनुसार प्रदर्शन',
            accuracyDistribution: 'सटीकता वितरण',
            excellentAccuracy: '90–100% सटीकता',
            goodAccuracy: '70–89% सटीकता',
            averageAccuracyRange: '50–69% सटीकता',
            below50Accuracy: '50% से कम सटीकता',
            difficultyWisePerformance: 'कठिनाई के अनुसार प्रदर्शन',
            timeWisePerformance: 'समय के अनुसार प्रदर्शन',
            analyticsSummary: 'विश्लेषण सारांश',
            analyticsSummaryNoData: 'अभी तक कोई प्रदर्शन डेटा उपलब्ध नहीं है।',
            analyticsSummaryMessage: 'आपने {sessions} सत्र पूरे किए हैं और आपकी औसत सटीकता {accuracy}% है। आपके हाल के प्रदर्शन का रुझान {trend} है। आपका सबसे अधिक खेला गया गेम {game} है।',
            weeklyActivity: 'साप्ताहिक गतिविधि',
            noAccuracyHistory: 'अभी तक सटीकता का इतिहास उपलब्ध नहीं है।',
            startingSession: 'प्रारंभिक सत्र',
        },

        memoriesPage: {
            backToDashboard: 'डैशबोर्ड पर वापस जाएँ',
            memoriesTitle: 'यादें',
            memoriesDescription:
                'महत्वपूर्ण पल, कहानियाँ और वे लोग सहेजें जिन्हें आप याद रखना चाहते हैं।',

            editMemory: 'याद संपादित करें',
            addMemory: 'एक याद जोड़ें',

            title: 'शीर्षक',
            description: 'विवरण',
            category: 'श्रेणी',
            memoryDate: 'याद की तारीख',

            titlePlaceholder:
                'जैसे: आगरा की पारिवारिक यात्रा',
            descriptionPlaceholder:
                'इस याद के बारे में लिखें...',

            saving: 'सहेजा जा रहा है...',
            updateMemory: 'याद अपडेट करें',
            saveMemory: 'याद सहेजें',
            cancelEdit: 'संपादन रद्द करें',

            savedMemories: 'सहेजी गई यादें',
            savedMemoriesDescription:
                'आपकी यादें आपके खाते में सुरक्षित रूप से संग्रहीत हैं।',

            memory: 'याद',
            memoriesPlural: 'यादें',

            loadingMemories:
                'यादें लोड हो रही हैं...',
            noMemories:
                'अभी तक कोई याद सहेजी नहीं गई है।',

            edit: 'संपादित करें',
            delete: 'हटाएँ',

            noDate: 'कोई तारीख नहीं दी गई',

            validationError:
                'कृपया शीर्षक और विवरण दोनों दर्ज करें।',
            loadError:
                'सर्वर से यादें लोड नहीं हो सकीं।',
            saveError:
                'याद सहेजी नहीं जा सकी।',
            deleteError:
                'याद हटाई नहीं जा सकी।',

            saveSuccess:
                'याद सफलतापूर्वक सहेजी गई।',
            updateSuccess:
                'याद सफलतापूर्वक अपडेट की गई।',
            deleteSuccess:
                'याद सफलतापूर्वक हटा दी गई।',

            deleteConfirm:
                'क्या आप वाकई इस याद को हटाना चाहते हैं?',

            categories: {
                General: 'सामान्य',
                Family: 'परिवार',
                Friends: 'दोस्त',
                Travel: 'यात्रा',
                Celebration: 'उत्सव',
                Childhood: 'बचपन',
                Other: 'अन्य',
            },
        },

        remindersPage: {
            backToDashboard: 'डैशबोर्ड पर वापस जाएँ',
            remindersTitle: 'रिमाइंडर',
            remindersDescription:
                'महत्वपूर्ण गतिविधियों, अपॉइंटमेंट और दैनिक कार्यों पर नज़र रखें।',

            editReminder: 'रिमाइंडर संपादित करें',
            addReminder: 'एक रिमाइंडर जोड़ें',

            title: 'शीर्षक',
            description: 'विवरण',
            category: 'श्रेणी',
            dueDateTime: 'देय तारीख और समय',

            titlePlaceholder:
                'जैसे: परिवार के साथ वीडियो कॉल',
            descriptionPlaceholder:
                'क्या याद रखना चाहिए?',

            markCompleted: 'पूर्ण के रूप में चिह्नित करें',

            saving: 'सहेजा जा रहा है...',
            updateReminder: 'रिमाइंडर अपडेट करें',
            saveReminder: 'रिमाइंडर सहेजें',
            cancelEdit: 'संपादन रद्द करें',

            savedReminders: 'सहेजे गए रिमाइंडर',
            savedRemindersDescription:
                'आपके रिमाइंडर आपके खाते में सुरक्षित रूप से संग्रहीत हैं।',

            reminder: 'रिमाइंडर',
            remindersPlural: 'रिमाइंडर',

            loadingReminders:
                'रिमाइंडर लोड हो रहे हैं...',
            noReminders:
                'अभी तक कोई रिमाइंडर सहेजा नहीं गया है।',

            completed: 'पूर्ण',
            overdue: 'समय सीमा पार',

            markActive: 'सक्रिय करें',
            markComplete: 'पूर्ण करें',
            edit: 'संपादित करें',
            delete: 'हटाएँ',

            noDueDate: 'कोई देय तारीख नहीं',

            validationError:
                'कृपया शीर्षक और विवरण दोनों दर्ज करें।',
            loadError:
                'सर्वर से रिमाइंडर लोड नहीं हो सके।',
            saveError:
                'रिमाइंडर सहेजा नहीं जा सका।',
            updateError:
                'रिमाइंडर अपडेट नहीं किया जा सका।',
            deleteError:
                'रिमाइंडर हटाया नहीं जा सका।',

            saveSuccess:
                'रिमाइंडर सफलतापूर्वक सहेजा गया।',
            updateSuccess:
                'रिमाइंडर सफलतापूर्वक अपडेट किया गया।',
            deleteSuccess:
                'रिमाइंडर सफलतापूर्वक हटाया गया।',
            completeSuccess:
                'रिमाइंडर को पूर्ण के रूप में चिह्नित किया गया।',
            markActiveSuccess:
                'रिमाइंडर को सक्रिय के रूप में चिह्नित किया गया।',

            deleteConfirm:
                'क्या आप वाकई इस रिमाइंडर को हटाना चाहते हैं?',

            categories: {
                General: 'सामान्य',
                Family: 'परिवार',
                Appointment: 'अपॉइंटमेंट',
                Medication: 'दवा',
                Activity: 'गतिविधि',
                Personal: 'व्यक्तिगत',
                Other: 'अन्य',
            },
        },
        caregiverPage: {
            backToDashboard: 'डैशबोर्ड पर वापस जाएँ',
            caregiverDashboardTitle:
                'देखभालकर्ता डैशबोर्ड',

            caregiverDashboardDescription:
                'हाल की मानसिक गतिविधि और महत्वपूर्ण दैनिक जानकारी की समीक्षा करें।',

            currentlyViewing: 'वर्तमान में देख रहे हैं',

            loadingCaregiverData:
                'देखभालकर्ता डेटा लोड हो रहा है...',

            caregiverOnlyError:
                'देखभालकर्ता डैशबोर्ड केवल देखभालकर्ता खातों के लिए उपलब्ध है।',

            loadError:
                'देखभालकर्ता डैशबोर्ड लोड नहीं हो सका।',

            noApprovedConnection:
                'कोई स्वीकृत बुज़ुर्ग कनेक्शन नहीं है',

            noApprovedConnectionDescription:
                'किसी बुज़ुर्ग उपयोगकर्ता से जुड़ें और उनकी स्वीकृति की प्रतीक्षा करें। उसके बाद आप उनकी Cognicare जानकारी देख सकेंगे।',

            totalSessions: 'कुल सत्र',
            gamesPlayed: 'खेले गए खेल',
            averageAccuracy: 'औसत सटीकता',
            savedMemories: 'सहेजी गई यादें',
            activeReminders: 'सक्रिय रिमाइंडर',
            averageMistakes: 'औसत गलतियाँ',
            averageCompletionTime: 'औसत पूर्णता समय',
            personalBestAccuracy: 'व्यक्तिगत सर्वश्रेष्ठ सटीकता',
            weeklyActivity: 'साप्ताहिक गतिविधि',

            connectedUser: 'कनेक्ट किया गया उपयोगकर्ता',

            connectedUserDescription:
                'आप अपने स्वीकृत बुज़ुर्ग कनेक्शन की मानसिक गतिविधि, यादें और रिमाइंडर देख रहे हैं।',

            gamePerformance: 'गेम प्रदर्शन',

            games: {
                memoryMatch: 'मेमोरी मैच',
                sequenceMemory: 'सीक्वेंस मेमोरी',
                objectRecall: 'ऑब्जेक्ट रिकॉल',
            },

            session: 'सत्र',
            sessions: 'सत्र',

            trend: 'रुझान',
            recent: 'हाल का',

            notEnoughData: 'पर्याप्त डेटा नहीं है',
            improving: 'सुधार हो रहा है',
            declining: 'गिरावट',
            stable: 'स्थिर',

            planning: 'योजना',

            upcomingReminders: 'आने वाले रिमाइंडर',

            upcomingRemindersDescription:
                'कनेक्ट किए गए बुज़ुर्ग उपयोगकर्ता के अगले सक्रिय रिमाइंडर।',

            noUpcomingReminders:
                'कोई आने वाला सक्रिय रिमाइंडर नहीं है।',

            recentActivity: 'हाल की गतिविधि',

            noSessionsRecorded:
                'अभी तक कोई सत्र रिकॉर्ड नहीं हुआ है।',

            game: 'खेल',
            difficulty: 'कठिनाई',
            accuracy: 'सटीकता',
            mistakes: 'गलतियाँ',
            time: 'समय',
            date: 'तारीख',

            noDueDate: 'कोई देय तारीख नहीं',
            unknown: 'अज्ञात',
        },

        caregiverLinksPage: {
            backToDashboard:
                'डैशबोर्ड पर वापस जाएँ',

            connections: 'कनेक्शन',

            caregiverConnections:
                'देखभालकर्ता कनेक्शन',

            caregiverRequests:
                'देखभालकर्ता अनुरोध',

            caregiverConnectionsDescription:
                'अपने Cognicare सफर में सहायता देने के लिए किसी बुज़ुर्ग उपयोगकर्ता से जुड़ें।',

            caregiverRequestsDescription:
                'देखभालकर्ता कनेक्शन अनुरोधों की समीक्षा और प्रबंधन करें।',

            newConnection:
                'नया कनेक्शन',

            connectWithElderly:
                'किसी बुज़ुर्ग उपयोगकर्ता से जुड़ें',

            connectWithElderlyDescription:
                'कनेक्शन अनुरोध भेजने के लिए बुज़ुर्ग उपयोगकर्ता का पंजीकृत Cognicare ईमेल दर्ज करें।',

            elderlyUserEmail:
                'बुज़ुर्ग उपयोगकर्ता का ईमेल',

            emailValidation:
                'कृपया बुज़ुर्ग उपयोगकर्ता का ईमेल पता दर्ज करें।',

            sending: 'भेजा जा रहा है...',
            sendRequest: 'अनुरोध भेजें',

            requestSent:
                'कनेक्शन अनुरोध सफलतापूर्वक भेजा गया।',

            sendError:
                'कनेक्शन अनुरोध नहीं भेजा जा सका।',

            yourRequests: 'आपके अनुरोध',
            incomingRequests:
                'प्राप्त अनुरोध',

            connectionStatus:
                'कनेक्शन स्थिति',

            loading: 'लोड हो रहा है...',
            refresh: 'रिफ्रेश',

            loadingConnections:
                'कनेक्शन लोड हो रहे हैं...',

            noCaregiverConnections:
                'अभी कोई देखभालकर्ता कनेक्शन नहीं है',

            noCaregiverRequests:
                'अभी कोई देखभालकर्ता अनुरोध नहीं है',

            noConnectionsDescription:
                'बुज़ुर्ग उपयोगकर्ता के पंजीकृत ईमेल पते का उपयोग करके अनुरोध भेजें।',

            noRequestsDescription:
                'नए देखभालकर्ता अनुरोध यहाँ दिखाई देंगे।',

            email: 'ईमेल',

            approve: 'स्वीकृत करें',
            reject: 'अस्वीकार करें',
            remove: 'हटाएँ',

            statusApproved: 'स्वीकृत',
            statusRejected: 'अस्वीकृत',
            statusPending: 'लंबित',

            connectedWith:
                'आप जुड़े हुए हैं',

            connectedToYourAccount:
                'आपके खाते से जुड़े हैं।',

            rejectedRequest:
                'ने यह अनुरोध अस्वीकार कर दिया।',

            youRejected:
                'आपने अस्वीकार किया',

            request: 'अनुरोध',

            waitingFor:
                'प्रतीक्षा कर रहे हैं',

            toRespond:
                'की प्रतिक्रिया का।',

            requestingToConnect:
                'आपसे जुड़ने का अनुरोध कर रहे हैं।',

            requestApproved:
                'देखभालकर्ता अनुरोध स्वीकृत किया गया।',

            requestRejected:
                'देखभालकर्ता अनुरोध अस्वीकार किया गया।',

            updateError:
                'देखभालकर्ता अनुरोध अपडेट नहीं किया जा सका।',

            connectionRemoved:
                'देखभालकर्ता कनेक्शन हटा दिया गया।',

            removeError:
                'कनेक्शन हटाया नहीं जा सका।',

            dataProtected:
                'आपका डेटा सुरक्षित है',

            dataProtectedDescription:
                'बुज़ुर्ग उपयोगकर्ता के अनुरोध को स्वीकृति देने के बाद ही देखभालकर्ता जुड़ता है। कनेक्शन को बाद में हटाया भी जा सकता है।',
        },

        memoryMatchPage: {
            backToGames: 'खेलों पर वापस जाएँ',
            title: 'मेमोरी मैच',

            description:
                'सभी समान जोड़े खोजें। समय लेकर खेल का आनंद लें।',

            gameStatistics: 'गेम आँकड़े',
            moves: 'चालें',
            matches: 'मिलान',
            mistakes: 'गलतियाँ',
            time: 'समय',
            accuracy: 'सटीकता',

            gameBoard: 'मेमोरी मैच गेम बोर्ड',
            cardShowing: 'कार्ड पर दिख रहा है',
            hiddenCard: 'छिपा हुआ मेमोरी कार्ड',

            wellDone: 'बहुत बढ़िया!',

            completedMessage: (moves) =>
                `आपने ${moves} चालों में सभी जोड़े खोज लिए।`,

            playAgain: 'फिर से खेलें',
            restartGame: 'गेम फिर से शुरू करें',

            previousSessions: 'पिछले सत्र',
            recentResults:
                'आपके हाल के मेमोरी मैच परिणाम।',

            clearHistory: 'इतिहास साफ़ करें',

            localHistoryNote:
                'इतिहास अभी केवल इस डिवाइस पर सहेजा गया है।',
        },
        sequenceMemoryPage: {
            backToGames: 'खेलों पर वापस जाएँ',
            title: 'सीक्वेंस मेमोरी',

            description:
                'वस्तुओं का क्रम याद रखें और उन्हें उसी क्रम में चुनें।',

            chooseDifficulty:
                'शुरू करने के लिए कठिनाई चुनें।',

            rememberSequence:
                'इस क्रम को याद रखें...',

            selectSameOrder:
                'अब वस्तुओं को उसी क्रम में चुनें।',

            notQuite:
                'थोड़ा गलत। समय लेकर अगला प्रयास करें।',

            excellent:
                '🎉 बहुत बढ़िया! आपने क्रम याद रखा।',

            selectDifficulty:
                'कठिनाई चुनें',

            startGame:
                'गेम शुरू करें',

            playAgain:
                'फिर से खेलें',

            items: 'वस्तुएँ',
            mistakes: 'गलतियाँ',
            time: 'समय',
            accuracy: 'सटीकता',

            sequenceToRemember:
                'याद रखने का क्रम',

            sequenceChoices:
                'क्रम के विकल्प',

            wellDone:
                'बहुत बढ़िया!',

            completeDescription:
                'आपने पूरा क्रम याद रखा।',

            difficulty:
                'कठिनाई',

            previousSessions:
                'पिछले सत्र',

            recentResults:
                'आपके हाल के सीक्वेंस मेमोरी परिणाम।',

            clearHistory:
                'इतिहास साफ़ करें',

            localHistoryNote:
                'इतिहास अभी केवल इस डिवाइस पर सहेजा गया है।',

            difficulties: {
                Easy: 'आसान',
                Medium: 'मध्यम',
                Hard: 'कठिन',
            },
        },

        objectRecallPage: {
            backToGames: 'खेलों पर वापस जाएँ',
            title: 'ऑब्जेक्ट रिकॉल',
            description:
                'जो वस्तुएँ आप देखते हैं उन्हें याद रखें, फिर उन्हें दिए गए विकल्पों में से चुनें।',
            chooseDifficulty:
                'शुरू करने के लिए कठिनाई चुनें।',
            rememberObjects:
                'इन वस्तुओं को याद रखें...',
            whichObjects:
                'आपने कौन-सी वस्तुएँ देखीं?',
            goodChoice:
                'अच्छा चुनाव! आगे बढ़ें।',
            wrongObject:
                'यह उन वस्तुओं में से नहीं थी। कोशिश करते रहें।',
            excellent:
                '🎉 बहुत बढ़िया! आपने सभी वस्तुएँ याद रखीं।',
            selectDifficulty:
                'कठिनाई चुनें',
            startGame:
                'गेम शुरू करें',
            playAgain:
                'फिर से खेलें',
            objects: 'वस्तुएँ',
            correct: 'सही',
            wrong: 'गलत',
            time: 'समय',
            accuracy: 'सटीकता',
            objectsToRemember:
                'याद रखने वाली वस्तुएँ',
            objectChoice:
                'वस्तु का विकल्प',
            wellDone: 'बहुत बढ़िया!',
            completedMessage: (count) =>
                `आपने सभी ${count} वस्तुएँ याद रखीं।`,
            difficulty: 'कठिनाई',
            previousSessions: 'पिछले सत्र',
            recentResults:
                'आपके हाल के ऑब्जेक्ट रिकॉल परिणाम।',
            clearHistory: 'इतिहास साफ़ करें',
            localHistoryNote:
                'इतिहास अभी केवल इस डिवाइस पर सहेजा गया है।',
            difficulties: {
                Easy: 'आसान',
                Medium: 'मध्यम',
                Hard: 'कठिन',
            },
        },

        recommendationPage: {
            title: 'व्यक्तिगत सुझाव',
            analyzing:
                'आपके हाल के प्रदर्शन का विश्लेषण किया जा रहा है...',

            unavailable:
                'सुझाव अभी उपलब्ध नहीं है।',

            noRecommendation:
                'अभी कोई सुझाव उपलब्ध नहीं है।',

            suggestedDifficulty:
                'सुझाई गई कठिनाई:',

            basedOn: 'आधार',

            session: 'सत्र',
            sessions: 'सत्र',

            startRecommendedGame:
                'सुझाया गया खेल शुरू करें',

            hideDetails:
                'सुझाव का विवरण छिपाएँ',

            whyRecommendation:
                'यह सुझाव क्यों दिया गया?',

            recentAccuracy:
                'हाल की सटीकता',

            overallAccuracy:
                'कुल सटीकता',

            mistakesPerSession:
                'प्रति सत्र गलतियाँ',

            performanceTrend:
                'प्रदर्शन का रुझान',

            sessionsAnalyzed:
                'विश्लेषित सत्र',

            recommendationExplanation:
                'यह सुझाव आपके हाल के खेल प्रदर्शन, गलतियों और प्रदर्शन के रुझान पर आधारित है।',

            improving: 'सुधार हो रहा है',
            declining: 'गिरावट',
            stable: 'स्थिर',
            notEnoughData: 'पर्याप्त डेटा नहीं है',

            games: {
                memoryMatch: 'मेमोरी मैच',
                sequenceMemory: 'सीक्वेंस मेमोरी',
                objectRecall: 'ऑब्जेक्ट रिकॉल',
            },
        },

        authPage: {
            language: 'भाषा',

            signInSubtitle:
                'जारी रखने के लिए साइन इन करें',

            createAccountSubtitle:
                'अपना Cognicare खाता बनाएँ',

            fullName:
                'पूरा नाम',

            fullNamePlaceholder:
                'अपना पूरा नाम दर्ज करें',

            email:
                'ईमेल',

            emailPlaceholder:
                'अपना ईमेल दर्ज करें',

            password:
                'पासवर्ड',

            passwordPlaceholder:
                'अपना पासवर्ड दर्ज करें',

            accountType:
                'खाते का प्रकार',

            elderlyUser:
                'बुज़ुर्ग उपयोगकर्ता',

            caregiver:
                'देखभालकर्ता',

            pleaseWait:
                'कृपया प्रतीक्षा करें...',

            signIn:
                'साइन इन करें',

            createAccount:
                'खाता बनाएँ',

            createAccountPrompt:
                'खाता नहीं है? एक बनाएँ',

            signInPrompt:
                'पहले से खाता है? साइन इन करें',

            accountCreated:
                'खाता सफलतापूर्वक बना दिया गया है। अब आप लॉग इन कर सकते हैं।',

            genericError:
                'कुछ गलत हो गया। कृपया फिर से प्रयास करें।',
        },
    },

    as: {
        languageName: 'অসমীয়া',
        language: 'ভাষা',
        readAloud: 'পঢ়ি শুনাওক',
        stopReading: 'পঢ়া বন্ধ কৰক',
        caregiver: 'যত্ন লওঁতা',
        elderlyUser: 'বৃদ্ধ ব্যৱহাৰকাৰী',
        logout: 'লগ আউট',

        dashboard: 'ডেশ্বব’ৰ্ড',

        greetingMorning: 'সুপ্ৰভাত',
        greetingAfternoon: 'শুভ দুপৰীয়া',
        greetingEvening: 'শুভ সন্ধিয়া',

        cognitiveGames: 'জ্ঞানীয় খেল',
        cognitiveGamesDescription:
            'আমোদজনক ধাঁধা আৰু খেলৰ সহায়ত আপোনাৰ মনৰ ব্যায়াম কৰক।',
        playNow: 'এতিয়া খেলক',

        performance: 'মোৰ প্ৰদৰ্শন',
        performanceDescription:
            'আপোনাৰ শেহতীয়া জ্ঞানীয় খেলৰ প্ৰদৰ্শন চাওক।',
        viewPerformance: 'প্ৰদৰ্শন চাওক',

        caregiverDashboard: 'যত্ন লওঁতাৰ ডেশ্বব’ৰ্ড',
        caregiverDashboardDescription:
            'শেহতীয়া জ্ঞানীয় কাৰ্যকলাপ আৰু প্ৰদৰ্শন পৰ্যালোচনা কৰক।',
        openCaregiverDashboard:
            'যত্ন লওঁতাৰ ডেশ্বব’ৰ্ড খোলক',

        caregiverConnections: 'যত্ন লওঁতাৰ সংযোগ',
        caregiverConnectionsDescription:
            'এজন বৃদ্ধ ব্যৱহাৰকাৰীৰ সৈতে সংযোগ কৰক আৰু যত্ন লওঁতাৰ সম্পৰ্ক পৰিচালনা কৰক।',
        manageConnections: 'সংযোগ পৰিচালনা কৰক',

        caregiverRequests: 'যত্ন লওঁতাৰ অনুৰোধ',
        caregiverRequestsDescription:
            'যত্ন লওঁতাৰ সংযোগ অনুৰোধসমূহ চাওক আৰু পৰিচালনা কৰক।',
        viewRequests: 'অনুৰোধ চাওক',

        memories: 'স্মৃতিসমূহ',
        memoriesDescription:
            'গুৰুত্বপূৰ্ণ মুহূৰ্ত আৰু কাহিনীবোৰ সংৰক্ষণ কৰি পুনৰ চাওক।',
        openMemories: 'স্মৃতিসমূহ খোলক',

        myMemories: 'মোৰ স্মৃতিসমূহ',
        myMemoriesDescription:
            'আপোনাৰ ফটো আৰু মৰমৰ মুহূৰ্তসমূহ চাওক।',
        viewMemories: 'স্মৃতিসমূহ চাওক',

        reminders: 'সোঁৱৰাই দিয়া',
        remindersDescription:
            'গুৰুত্বপূৰ্ণ কাৰ্যকলাপ আৰু কামসমূহৰ ওপৰত নজৰ ৰাখক।',
        openReminders: 'সোঁৱৰাই দিয়া খোলক',

        todaysReminders: 'আজিৰ সোঁৱৰাই দিয়া',
        todaysRemindersDescription:
            'আজিৰ আপোনাৰ কাম আৰু সোঁৱৰাই দিয়া বিষয়সমূহ।',
        seeAllReminders: 'সকলো সোঁৱৰাই দিয়া চাওক',

        caregiverHelp: 'যত্ন লওঁতাৰ সহায়',
        caregiverHelpDescription:
            'আপোনাৰ যত্ন লওঁতাৰ সৈতে যোগাযোগ কৰক বা যিকোনো সময়তে সহায় লাভ কৰক।',
        getHelp: 'সহায় লাভ কৰক',

        online:
            'অনলাইন — আপোনাৰ ডাটা সাধাৰণভাৱে ছিংক হ’ব।',
        offline:
            'অফলাইন — আপোনাৰ খেলৰ ফলাফল সংৰক্ষণ হ’ব আৰু ইণ্টাৰনেট পুনৰ আহিলে ছিংক হ’ব।',

        back: 'উভতি যাওক',

        footer:
            'Cognicare NER — SIH 2025 প্ৰট’টাইপ',

        gamesPage: {
            icon: '🧠',
            title: 'জ্ঞানীয় খেল',
            subtitle:
                'আপোনাৰ মনৰ ব্যায়াম কৰিবলৈ এটা খেল বাছক, শ্ৰীমতী দাস।',
            backButton: 'ডেশ্বব’ৰ্ডলৈ উভতি যাওক',

            games: [
                {
                    id: 'memory-match',
                    icon: '🃏',
                    title: 'মেম’ৰী মেচ',
                    description:
                        'কাৰ্ডবোৰ উলটাই মিল থকা যোৰ বিচাৰি আপোনাৰ স্মৃতিশক্তিৰ ব্যায়াম কৰক।',
                    button: 'অতি সোনকালে আহিব',
                },
                {
                    id: 'sequence-memory',
                    icon: '🔢',
                    title: 'ছিকুৱেন্স মেম’ৰী',
                    description:
                        'সংখ্যা বা ৰঙৰ ক্ৰমটো মনত ৰাখি পুনৰাবৃত্তি কৰক।',
                    button: 'অতি সোনকালে আহিব',
                },
                {
                    id: 'object-recall',
                    icon: '👁️',
                    title: 'অবজেক্ট ৰিকল',
                    description:
                        'বস্তুবোৰ চাওক আৰু তাৰ পিছত আপুনি কি দেখিছিল মনত পেলাওক।',
                    button: 'অতি সোনকালে আহিব',
                },
            ],
        },

        performancePage: {
            backToDashboard: 'ডেশ্বব’ৰ্ডলৈ উভতি যাওক',
            performanceDashboard: 'প্ৰদৰ্শন ডেশ্বব’ৰ্ড',
            performancePageDescription:
                'আপোনাৰ শেহতীয়া জ্ঞানীয় খেলৰ প্ৰদৰ্শন পৰ্যালোচনা কৰক।',
            loadingPerformance:
                'প্ৰদৰ্শনৰ ডাটা লোড হৈ আছে...',
            totalSessions: 'মুঠ সেশ্যন',
            gamesPlayed: 'খেলা খেল',
            averageAccuracy: 'গড় সঠিকতা',
            averageTime: 'গড় সময়',
            averageMistakes: 'গড় ভুল',
            mostPlayedGame: 'সৰ্বাধিক খেলা খেল',
            recentSessions: 'শেহতীয়া সেশ্যন',
            performanceDataSource:
                'আপোনাৰ একাউণ্টৰ পৰা FastAPI আৰু PostgreSQLৰ জৰিয়তে ডাটা লোড কৰা হৈছে।',
            noSessions:
                'এতিয়ালৈকে কোনো গেম সেশ্যন ৰেকৰ্ড কৰা হোৱা নাই।',
            difficulty: 'কঠিনতা',
            accuracy: 'সঠিকতা',
            mistakes: 'ভুল',
            time: 'সময়',
            performanceTrend: 'কাৰ্যক্ষমতাৰ ধাৰা',
            trendImproving: 'উন্নতি হৈছে',
            trendNeedsPractice: 'অনুশীলনৰ প্ৰয়োজন',
            trendStable: 'স্থিৰ',
            accuracyChangeOverTime: 'সময়ৰ সৈতে সঠিকতাৰ পৰিৱৰ্তন',
            personalBestAccuracy: 'ব্যক্তিগত সৰ্বোত্তম সঠিকতা',
            bestPerformanceByGame: 'খেল অনুসৰি সৰ্বোত্তম প্ৰদৰ্শন',
            gameWisePerformance: 'খেল অনুসৰি প্ৰদৰ্শন',
            accuracyDistribution: 'সঠিকতাৰ বিতৰণ',
            excellentAccuracy: '৯০–১০০% সঠিকতা',
            goodAccuracy: '৭০–৮৯% সঠিকতা',
            averageAccuracyRange: '৫০–৬৯% সঠিকতা',
            below50Accuracy: '৫০% তলৰ সঠিকতা',
            difficultyWisePerformance: 'কঠিনতা অনুসৰি প্ৰদৰ্শন',
            timeWisePerformance: 'সময় অনুসৰি প্ৰদৰ্শন',
            analyticsSummary: 'বিশ্লেষণৰ সাৰাংশ',
            analyticsSummaryNoData: 'এতিয়ালৈকে কোনো কাৰ্যক্ষমতাৰ তথ্য উপলব্ধ নহয়।',
            analyticsSummaryMessage: 'আপুনি {sessions}টা সেশ্যন সম্পূৰ্ণ কৰিছে আৰু আপোনাৰ গড় সঠিকতা {accuracy}%। আপোনাৰ শেহতীয়া কাৰ্যক্ষমতাৰ ধাৰা {trend}। আপোনাৰ সৰ্বাধিক খেলা খেল হৈছে {game}।',
            weeklyActivity: 'সাপ্তাহিক কাৰ্যকলাপ',
            noAccuracyHistory: 'এতিয়ালৈকে সঠিকতাৰ ইতিহাস উপলব্ধ নহয়।',
            startingSession: 'আৰম্ভণিৰ সেশ্যন',
        },

        memoriesPage: {
            backToDashboard:
                'ডেশ্বব’ৰ্ডলৈ উভতি যাওক',
            memoriesTitle: 'স্মৃতিসমূহ',
            memoriesDescription:
                'গুৰুত্বপূৰ্ণ মুহূৰ্ত, কাহিনী আৰু আপুনি মনত ৰাখিব বিচৰা মানুহবোৰ সংৰক্ষণ কৰক।',

            editMemory: 'স্মৃতি সম্পাদনা কৰক',
            addMemory: 'এটা স্মৃতি যোগ কৰক',

            title: 'শিৰোনাম',
            description: 'বিৱৰণ',
            category: 'শ্ৰেণী',
            memoryDate: 'স্মৃতিৰ তাৰিখ',

            titlePlaceholder:
                'যেনে: আগ্ৰালৈ পৰিয়ালৰ ভ্ৰমণ',
            descriptionPlaceholder:
                'এই স্মৃতিৰ বিষয়ে লিখক...',

            saving: 'সংৰক্ষণ হৈ আছে...',
            updateMemory: 'স্মৃতি আপডেট কৰক',
            saveMemory: 'স্মৃতি সংৰক্ষণ কৰক',
            cancelEdit: 'সম্পাদনা বাতিল কৰক',

            savedMemories: 'সংৰক্ষিত স্মৃতিসমূহ',
            savedMemoriesDescription:
                'আপোনাৰ স্মৃতিসমূহ আপোনাৰ একাউণ্টত সুৰক্ষিতভাৱে সংৰক্ষণ কৰা হয়।',

            memory: 'স্মৃতি',
            memoriesPlural: 'স্মৃতিসমূহ',

            loadingMemories:
                'স্মৃতিসমূহ লোড হৈ আছে...',
            noMemories:
                'এতিয়ালৈকে কোনো স্মৃতি সংৰক্ষণ কৰা হোৱা নাই।',

            edit: 'সম্পাদনা',
            delete: 'মচি পেলাওক',

            noDate:
                'কোনো তাৰিখ দিয়া হোৱা নাই',

            validationError:
                'অনুগ্ৰহ কৰি শিৰোনাম আৰু বিৱৰণ দুয়োটা লিখক।',
            loadError:
                'ছাৰ্ভাৰৰ পৰা স্মৃতিসমূহ লোড কৰিব পৰা নগ’ল।',
            saveError:
                'স্মৃতি সংৰক্ষণ কৰিব পৰা নগ’ল।',
            deleteError:
                'স্মৃতি মচি পেলাব পৰা নগ’ল।',

            saveSuccess:
                'স্মৃতি সফলভাৱে সংৰক্ষণ কৰা হ’ল।',
            updateSuccess:
                'স্মৃতি সফলভাৱে আপডেট কৰা হ’ল।',
            deleteSuccess:
                'স্মৃতি সফলভাৱে মচি পেলোৱা হ’ল।',

            deleteConfirm:
                'আপুনি সঁচাকৈয়ে এই স্মৃতিটো মচি পেলাব বিচাৰে নে?',

            categories: {
                General: 'সাধাৰণ',
                Family: 'পৰিয়াল',
                Friends: 'বন্ধু',
                Travel: 'ভ্ৰমণ',
                Celebration: 'উদযাপন',
                Childhood: 'শৈশৱ',
                Other: 'অন্যান্য',
            },
        },

        remindersPage: {
            backToDashboard:
                'ডেশ্বব’ৰ্ডলৈ উভতি যাওক',
            remindersTitle: 'সোঁৱৰাই দিয়া',
            remindersDescription:
                'গুৰুত্বপূৰ্ণ কাৰ্যকলাপ, এপইণ্টমেণ্ট আৰু দৈনন্দিন কামসমূহৰ ওপৰত নজৰ ৰাখক।',

            editReminder:
                'সোঁৱৰাই দিয়া সম্পাদনা কৰক',
            addReminder:
                'এটা সোঁৱৰাই দিয়া যোগ কৰক',

            title: 'শিৰোনাম',
            description: 'বিৱৰণ',
            category: 'শ্ৰেণী',
            dueDateTime:
                'নিৰ্ধাৰিত তাৰিখ আৰু সময়',

            titlePlaceholder:
                'যেনে: পৰিয়ালৰ সৈতে ভিডিঅ’ কল',
            descriptionPlaceholder:
                'কি মনত ৰখা উচিত?',

            markCompleted:
                'সম্পূৰ্ণ বুলি চিহ্নিত কৰক',

            saving: 'সংৰক্ষণ হৈ আছে...',
            updateReminder:
                'সোঁৱৰাই দিয়া আপডেট কৰক',
            saveReminder:
                'সোঁৱৰাই দিয়া সংৰক্ষণ কৰক',
            cancelEdit: 'সম্পাদনা বাতিল কৰক',

            savedReminders:
                'সংৰক্ষিত সোঁৱৰাই দিয়াসমূহ',
            savedRemindersDescription:
                'আপোনাৰ সোঁৱৰাই দিয়াসমূহ আপোনাৰ একাউণ্টত সুৰক্ষিতভাৱে সংৰক্ষণ কৰা হয়।',

            reminder: 'সোঁৱৰাই দিয়া',
            remindersPlural:
                'সোঁৱৰাই দিয়াসমূহ',

            loadingReminders:
                'সোঁৱৰাই দিয়াসমূহ লোড হৈ আছে...',
            noReminders:
                'এতিয়ালৈকে কোনো সোঁৱৰাই দিয়া সংৰক্ষণ কৰা হোৱা নাই।',

            completed: 'সম্পূৰ্ণ',
            overdue: 'সময় পাৰ হৈ গৈছে',

            markActive: 'সক্ৰিয় কৰক',
            markComplete: 'সম্পূৰ্ণ কৰক',
            edit: 'সম্পাদনা',
            delete: 'মচি পেলাওক',

            noDueDate:
                'কোনো নিৰ্ধাৰিত তাৰিখ নাই',

            validationError:
                'অনুগ্ৰহ কৰি শিৰোনাম আৰু বিৱৰণ দুয়োটা লিখক।',
            loadError:
                'ছাৰ্ভাৰৰ পৰা সোঁৱৰাই দিয়াসমূহ লোড কৰিব পৰা নগ’ল।',
            saveError:
                'সোঁৱৰাই দিয়াটো সংৰক্ষণ কৰিব পৰা নগ’ল।',
            updateError:
                'সোঁৱৰাই দিয়াটো আপডেট কৰিব পৰা নগ’ল।',
            deleteError:
                'সোঁৱৰাই দিয়াটো মচি পেলাব পৰা নগ’ল।',

            saveSuccess:
                'সোঁৱৰাই দিয়াটো সফলভাৱে সংৰক্ষণ কৰা হ’ল।',
            updateSuccess:
                'সোঁৱৰাই দিয়াটো সফলভাৱে আপডেট কৰা হ’ল।',
            deleteSuccess:
                'সোঁৱৰাই দিয়াটো সফলভাৱে মচি পেলোৱা হ’ল।',
            completeSuccess:
                'সোঁৱৰাই দিয়াটো সম্পূৰ্ণ বুলি চিহ্নিত কৰা হ’ল।',
            markActiveSuccess:
                'সোঁৱৰাই দিয়াটো সক্ৰিয় বুলি চিহ্নিত কৰা হ’ল।',

            deleteConfirm:
                'আপুনি সঁচাকৈয়ে এই সোঁৱৰাই দিয়াটো মচি পেলাব বিচাৰে নে?',

            categories: {
                General: 'সাধাৰণ',
                Family: 'পৰিয়াল',
                Appointment: 'এপইণ্টমেণ্ট',
                Medication: 'ঔষধ',
                Activity: 'কাৰ্যকলাপ',
                Personal: 'ব্যক্তিগত',
                Other: 'অন্যান্য',
            },
        },
        caregiverPage: {
            backToDashboard:
                'ডেশ্বব’ৰ্ডলৈ উভতি যাওক',

            caregiverDashboardTitle:
                'যত্ন লওঁতাৰ ডেশ্বব’ৰ্ড',

            caregiverDashboardDescription:
                'শেহতীয়া জ্ঞানীয় কাৰ্যকলাপ আৰু গুৰুত্বপূৰ্ণ দৈনন্দিন তথ্য পৰ্যালোচনা কৰক।',

            currentlyViewing:
                'বৰ্তমান চাই আছে',

            loadingCaregiverData:
                'যত্ন লওঁতাৰ ডাটা লোড হৈ আছে...',

            caregiverOnlyError:
                'যত্ন লওঁতাৰ ডেশ্বব’ৰ্ড কেৱল যত্ন লওঁতাৰ একাউণ্টৰ বাবে উপলব্ধ।',

            loadError:
                'যত্ন লওঁতাৰ ডেশ্বব’ৰ্ড লোড কৰিব পৰা নগ’ল।',

            noApprovedConnection:
                'কোনো অনুমোদিত বৃদ্ধ ব্যৱহাৰকাৰীৰ সংযোগ নাই',

            noApprovedConnectionDescription:
                'এজন বৃদ্ধ ব্যৱহাৰকাৰীৰ সৈতে সংযোগ কৰক আৰু তেওঁলোকৰ অনুমোদনৰ বাবে অপেক্ষা কৰক। তাৰ পিছত তেওঁলোকৰ Cognicare তথ্য চাব পাৰিব।',

            totalSessions: 'মুঠ সেশ্যন',
            gamesPlayed: 'খেলা খেল',
            averageAccuracy: 'গড় সঠিকতা',
            savedMemories: 'সংৰক্ষিত স্মৃতিসমূহ',
            activeReminders: 'সক্ৰিয় সোঁৱৰাই দিয়া',
            averageMistakes: 'গড় ভুল',
            averageCompletionTime: 'গড় সম্পন্নতা সময়',
            personalBestAccuracy: 'ব্যক্তিগত সর্বশ্রেষ্ঠ সঠিকতা',
            weeklyActivity: 'সাপ্তাহিক কার্যকলাপ',

            connectedUser:
                'সংযুক্ত ব্যৱহাৰকাৰী',

            connectedUserDescription:
                'আপুনি আপোনাৰ অনুমোদিত বৃদ্ধ ব্যৱহাৰকাৰীৰ জ্ঞানীয় কাৰ্যকলাপ, স্মৃতিসমূহ আৰু সোঁৱৰাই দিয়াসমূহ চাই आছে।',

            gamePerformance:
                'খেলৰ প্ৰদৰ্শন',

            games: {
                memoryMatch: 'মেম’ৰী মেচ',
                sequenceMemory: 'ছিকুৱেন্স মেম’ৰী',
                objectRecall: 'অবজেক্ট ৰিকল',
            },

            session: 'সেশ্যন',
            sessions: 'সেশ্যনসমূহ',

            trend: 'ধাৰা',
            recent: 'শেহতীয়া',

            notEnoughData:
                'পৰ্যাপ্ত ডাটা নাই',
            improving: 'উন্নতি হৈছে',
            declining: 'অৱনতি হৈছে',
            stable: 'স্থিতিশীল',

            planning: 'পৰিকল্পনা',

            upcomingReminders:
                'আগন্তুক সোঁৱৰাই দিয়াসমূহ',

            upcomingRemindersDescription:
                'সংযুক্ত বৃদ্ধ ব্যৱহাৰকাৰীৰ পৰৱৰ্তী সক্ৰিয় সোঁৱৰাই দিয়াসমূহ।',

            noUpcomingReminders:
                'কোনো আগন্তুক সক্ৰিয় সোঁৱৰাই দিয়া নাই।',

            recentActivity:
                'শেহতীয়া কাৰ্যকলাপ',

            noSessionsRecorded:
                'এতিয়ালৈকে কোনো সেশ্যন ৰেকৰ্ড কৰা হোৱা নাই।',

            game: 'খেল',
            difficulty: 'কঠিনতা',
            accuracy: 'সঠিকতা',
            mistakes: 'ভুল',
            time: 'সময়',
            date: 'তাৰিখ',

            noDueDate:
                'কোনো নিৰ্ধাৰিত তাৰিখ নাই',

            unknown: 'অজ্ঞাত',
        },

        caregiverLinksPage: {
            backToDashboard:
                'ডেশ্বব’ৰ্ডলৈ উভতি যাওক',

            connections: 'সংযোগ',

            caregiverConnections:
                'যত্ন লওঁতাৰ সংযোগ',

            caregiverRequests:
                'যত্ন লওঁতাৰ অনুৰোধ',

            caregiverConnectionsDescription:
                'Cognicare যাত্ৰাত সহায় কৰিবলৈ এজন বৃদ্ধ ব্যৱহাৰকাৰীৰ সৈতে সংযোগ কৰক।',

            caregiverRequestsDescription:
                'যত্ন লওঁতাৰ সংযোগ অনুৰোধসমূহ পৰ্যালোচনা আৰু পৰিচালনা কৰক।',

            newConnection:
                'নতুন সংযোগ',

            connectWithElderly:
                'এজন বৃদ্ধ ব্যৱহাৰকাৰীৰ সৈতে সংযোগ কৰক',

            connectWithElderlyDescription:
                'সংযোগ অনুৰোধ পঠিয়াবলৈ বৃদ্ধ ব্যৱহাৰকাৰীৰ পঞ্জীয়নভুক্ত Cognicare ইমেইল ঠিকনা লিখক।',

            elderlyUserEmail:
                'বৃদ্ধ ব্যৱহাৰকাৰীৰ ইমেইল',

            emailValidation:
                'অনুগ্ৰহ কৰি বৃদ্ধ ব্যৱহাৰকাৰীৰ ইমেইল ঠিকনা লিখক।',

            sending: 'পঠোৱা হৈ আছে...',
            sendRequest: 'অনুৰোধ পঠিয়াওক',

            requestSent:
                'সংযোগ অনুৰোধ সফলভাৱে পঠোৱা হ’ল।',

            sendError:
                'সংযোগ অনুৰোধ পঠিয়াব পৰা নগ’ল।',

            yourRequests:
                'আপোনাৰ অনুৰোধসমূহ',

            incomingRequests:
                'অহা অনুৰোধসমূহ',

            connectionStatus:
                'সংযোগৰ অৱস্থা',

            loading: 'লোড হৈ আছে...',
            refresh: 'ৰিফ্ৰেছ',

            loadingConnections:
                'সংযোগসমূহ লোড হৈ আছে...',

            noCaregiverConnections:
                'এতিয়ালৈকে কোনো যত্ন লওঁতাৰ সংযোগ নাই',

            noCaregiverRequests:
                'এতিয়ালৈকে কোনো যত্ন লওঁতাৰ অনুৰোধ নাই',

            noConnectionsDescription:
                'বৃদ্ধ ব্যৱহাৰকাৰীৰ পঞ্জীয়নভুক্ত ইমেইল ঠিকনা ব্যৱহাৰ কৰি অনুৰোধ পঠিয়াওক।',

            noRequestsDescription:
                'নতুন যত্ন লওঁতাৰ অনুৰোধ ইয়াত দেখা যাব।',

            email: 'ইমেইল',

            approve: 'অনুমোদন কৰক',
            reject: 'প্ৰত্যাখ্যান কৰক',
            remove: 'আঁতৰাওক',

            statusApproved: 'অনুমোদিত',
            statusRejected: 'প্ৰত্যাখ্যাত',
            statusPending: 'অপেক্ষাৰত',

            connectedWith:
                'আপুনি সংযুক্ত হৈ আছে',

            connectedToYourAccount:
                'আপোনাৰ একাউণ্টৰ সৈতে সংযুক্ত হৈছে।',

            rejectedRequest:
                'এই অনুৰোধটো প্ৰত্যাখ্যান কৰিলে।',

            youRejected:
                'আপুনি প্ৰত্যাখ্যান কৰিলে',

            request: 'অনুৰোধ',

            waitingFor:
                'অপেক্ষা কৰি আছে',

            toRespond:
                'উত্তৰৰ বাবে।',

            requestingToConnect:
                'আপোনাৰ সৈতে সংযোগ কৰিবলৈ অনুৰোধ কৰিছে।',

            requestApproved:
                'যত্ন লওঁতাৰ অনুৰোধ অনুমোদন কৰা হ’ল।',

            requestRejected:
                'যত্ন লওঁতাৰ অনুৰোধ প্ৰত্যাখ্যান কৰা হ’ল।',

            updateError:
                'যত্ন লওঁতাৰ অনুৰোধ আপডেট কৰিব পৰা নগ’ল।',

            connectionRemoved:
                'যত্ন লওঁতাৰ সংযোগ আঁতৰোৱা হ’ল।',

            removeError:
                'সংযোগ আঁতৰাব পৰা নগ’ল।',

            dataProtected:
                'আপোনাৰ ডাটা সুৰক্ষিত থাকে',

            dataProtectedDescription:
                'বৃদ্ধ ব্যৱহাৰকাৰীয়ে অনুৰোধ অনুমোদন কৰাৰ পিছতহে যত্ন লওঁতা সংযুক্ত হয়। সংযোগ পিছত আঁতৰাবও পাৰি।',
        },

        memoryMatchPage: {
            backToGames:
                'খেলসমূহলৈ উভতি যাওক',

            title: 'মেম’ৰী মেচ',

            description:
                'সকলো মিল থকা যোৰ বিচাৰক। সময় লৈ খেলখন উপভোগ কৰক।',

            gameStatistics:
                'খেলৰ পৰিসংখ্যা',

            moves: 'চাল',
            matches: 'মিল',
            mistakes: 'ভুল',
            time: 'সময়',
            accuracy: 'সঠিকতা',

            gameBoard:
                'মেম’ৰী মেচ খেলৰ ব’ৰ্ড',

            cardShowing:
                'কাৰ্ডত দেখা গৈছে',

            hiddenCard:
                'লুকাই থকা মেম’ৰী কাৰ্ড',

            wellDone:
                'বহুত ভাল!',

            completedMessage: (moves) =>
                `আপুনি ${moves} চালত সকলো যোৰ বিচাৰি উলিয়ালে।`,

            playAgain:
                'পুনৰ খেলক',

            restartGame:
                'খেল পুনৰ আৰম্ভ কৰক',

            previousSessions:
                'পূৰ্বৰ সেশ্যনসমূহ',

            recentResults:
                'আপোনাৰ শেহতীয়া মেম’ৰী মেচৰ ফলাফল।',

            clearHistory:
                'ইতিহাস পৰিষ্কাৰ কৰক',

            localHistoryNote:
                'ইতিহাস বৰ্তমান কেৱল এই ডিভাইচত সংৰক্ষণ কৰা হৈছে।',
        },

        sequenceMemoryPage: {
            backToGames:
                'খেলসমূহলৈ উভতি যাওক',

            title:
                'ছিকুৱেন্স মেম’ৰী',

            description:
                'বস্তুবোৰৰ ক্ৰমটো মনত ৰাখক আৰু একেটা ক্ৰমতে সেইবোৰ বাছক।',

            chooseDifficulty:
                'আৰম্ভ কৰিবলৈ কঠিনতা বাছক।',

            rememberSequence:
                'এই ক্ৰমটো মনত ৰাখক...',

            selectSameOrder:
                'এতিয়া বস্তুবোৰ একেটা ক্ৰমতে বাছক।',

            notQuite:
                'অলপ ভুল হৈছে। সময় লৈ পৰৱৰ্তীটো চেষ্টা কৰক।',

            excellent:
                '🎉 উৎকৃষ্ট! আপুনি ক্ৰমটো মনত ৰাখিলে।',

            selectDifficulty:
                'কঠিনতা বাছক',

            startGame:
                'খেল আৰম্ভ কৰক',

            playAgain:
                'পুনৰ খেলক',

            items:
                'বস্তু',

            mistakes:
                'ভুল',

            time:
                'সময়',

            accuracy:
                'সঠিকতা',

            sequenceToRemember:
                'মনত ৰাখিবলগীয়া ক্ৰম',

            sequenceChoices:
                'ক্ৰমৰ বিকল্প',

            wellDone:
                'বহুত ভাল!',

            completeDescription:
                'আপুনি সম্পূৰ্ণ ক্ৰমটো মনত ৰাখিলে।',

            difficulty:
                'কঠিনতা',

            previousSessions:
                'পূৰ্বৰ সেশ্যনসমূহ',

            recentResults:
                'আপোনাৰ শেহতীয়া ছিকুৱেন্স মেম’ৰীৰ ফলাফল।',

            clearHistory:
                'ইতিহাস পৰিষ্কাৰ কৰক',

            localHistoryNote:
                'ইতিহাস বৰ্তমান কেৱল এই ডিভাইচত সংৰক্ষণ কৰা হৈছে।',

            difficulties: {
                Easy: 'সহজ',
                Medium: 'মধ্যম',
                Hard: 'কঠিন',
            },
        },
        objectRecallPage: {
            backToGames: 'খেলসমূহলৈ উভতি যাওক',
            title: 'অবজেক্ট ৰিকল',
            description:
                'আপুনি দেখা বস্তুবোৰ মনত ৰাখক, তাৰ পিছত বিকল্পবোৰৰ পৰা সেইবোৰ বাছক।',
            chooseDifficulty:
                'আৰম্ভ কৰিবলৈ কঠিনতা বাছক।',
            rememberObjects:
                'এই বস্তুবোৰ মনত ৰাখক...',
            whichObjects:
                'আপুনি কোনবোৰ বস্তু দেখিছিল?',
            goodChoice:
                'ভাল বাছনি! আগবাঢ়ি যাওক।',
            wrongObject:
                'এইটো সেই বস্তুবোৰৰ ভিতৰত নাছিল। চেষ্টা কৰি থাকক।',
            excellent:
                '🎉 উৎকৃষ্ট! আপুনি সকলো বস্তু মনত ৰাখিলে।',
            selectDifficulty:
                'কঠিনতা বাছক',
            startGame:
                'খেল আৰম্ভ কৰক',
            playAgain:
                'পুনৰ খেলক',
            objects: 'বস্তু',
            correct: 'শুদ্ধ',
            wrong: 'ভুল',
            time: 'সময়',
            accuracy: 'সঠিকতা',
            objectsToRemember:
                'মনত ৰাখিবলগীয়া বস্তু',
            objectChoice:
                'বস্তুৰ বিকল্প',
            wellDone: 'বহুত ভাল!',
            completedMessage: (count) =>
                `আপুনি সকলো ${count}টা বস্তু মনত ৰাখিলে।`,
            difficulty: 'কঠিনতা',
            previousSessions:
                'পূৰ্বৰ সেশ্যনসমূহ',
            recentResults:
                'আপোনাৰ শেহতীয়া অবজেক্ট ৰিকলৰ ফলাফল।',
            clearHistory:
                'ইতিহাস পৰিষ্কাৰ কৰক',
            localHistoryNote:
                'ইতিহাস বৰ্তমান কেৱল এই ডিভাইচত সংৰক্ষণ কৰা হৈছে।',
            difficulties: {
                Easy: 'সহজ',
                Medium: 'মধ্যম',
                Hard: 'কঠিন',
            },
        },

        recommendationPage: {
            title: 'ব্যক্তিগত পৰামৰ্শ',

            analyzing:
                'আপোনাৰ শেহতীয়া প্ৰদৰ্শন বিশ্লেষণ কৰা হৈ আছে...',

            unavailable:
                'পৰামৰ্শ বৰ্তমান উপলব্ধ নহয়।',

            noRecommendation:
                'এতিয়ালৈকে কোনো পৰামৰ্শ উপলব্ধ নাই।',

            suggestedDifficulty:
                'পৰামৰ্শ দিয়া কঠিনতা:',

            basedOn:
                'ভিত্তি কৰি',

            session: 'সেশ্যন',
            sessions: 'সেশ্যনসমূহ',

            startRecommendedGame:
                'পৰামৰ্শ দিয়া খেল আৰম্ভ কৰক',

            hideDetails:
                'পৰামৰ্শৰ বিৱৰণ লুকুৱাওক',

            whyRecommendation:
                'এই পৰামৰ্শ কিয়?',

            recentAccuracy:
                'শেহতীয়া সঠিকতা',

            overallAccuracy:
                'সামগ্ৰিক সঠিকতা',

            mistakesPerSession:
                'প্ৰতি সেশ্যনত ভুল',

            performanceTrend:
                'প্ৰদৰ্শনৰ ধাৰা',

            sessionsAnalyzed:
                'বিশ্লেষণ কৰা সেশ্যন',

            recommendationExplanation:
                'এই পৰামৰ্শ আপোনাৰ শেহতীয়া খেলৰ প্ৰদৰ্শন, ভুল আৰু প্ৰদৰ্শনৰ ধাৰাৰ ওপৰত ভিত্তি কৰি দিয়া হৈছে।',

            improving: 'উন্নতি হৈছে',
            declining: 'অৱনতি হৈছে',
            stable: 'স্থিতিশীল',
            notEnoughData:
                'পৰ্যাপ্ত ডাটা নাই',

            games: {
                memoryMatch: 'মেম’ৰী মেচ',
                sequenceMemory: 'ছিকুৱেন্স মেম’ৰী',
                objectRecall: 'অবজেক্ট ৰিকল',
            },
        },

        authPage: {
            language: 'ভাষা',

            signInSubtitle:
                'আগবাঢ়িবলৈ ছাইন ইন কৰক',

            createAccountSubtitle:
                'আপোনাৰ Cognicare একাউণ্ট সৃষ্টি কৰক',

            fullName:
                'সম্পূৰ্ণ নাম',

            fullNamePlaceholder:
                'আপোনাৰ সম্পূৰ্ণ নাম লিখক',

            email:
                'ইমেইল',

            emailPlaceholder:
                'আপোনাৰ ইমেইল লিখক',

            password:
                'পাছৱৰ্ড',

            passwordPlaceholder:
                'আপোনাৰ পাছৱৰ্ড লিখক',

            accountType:
                'একাউণ্টৰ ধৰণ',

            elderlyUser:
                'বৃদ্ধ ব্যৱহাৰকাৰী',

            caregiver:
                'যত্ন লওঁতা',

            pleaseWait:
                'অনুগ্ৰহ কৰি অপেক্ষা কৰক...',

            signIn:
                'ছাইন ইন কৰক',

            createAccount:
                'একাউণ্ট সৃষ্টি কৰক',

            createAccountPrompt:
                'একাউণ্ট নাই? এটা সৃষ্টি কৰক',

            signInPrompt:
                'ইতিমধ্যে একাউণ্ট আছে? ছাইন ইন কৰক',

            accountCreated:
                'একাউণ্ট সফলভাৱে সৃষ্টি কৰা হ’ল। এতিয়া আপুনি লগ ইন কৰিব পাৰে।',

            genericError:
                'কিবা ভুল হৈছে। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।',
        },
    },
}

export default translations