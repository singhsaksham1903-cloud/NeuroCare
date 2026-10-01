// ============================================
// Cognicare NER — Regional Cultural Content
// ============================================

// The eight states of North Eastern Region.
export const NER_STATES = [
    {
        id: 'arunachal-pradesh',
        en: 'Arunachal Pradesh',
        hi: 'अरुणाचल प्रदेश',
        as: 'অৰুণাচল প্ৰদেশ',
    },

    {
        id: 'assam',
        en: 'Assam',
        hi: 'असम',
        as: 'অসম',
    },

    {
        id: 'manipur',
        en: 'Manipur',
        hi: 'मणिपुर',
        as: 'মণিপুৰ',
    },

    {
        id: 'meghalaya',
        en: 'Meghalaya',
        hi: 'मेघालय',
        as: 'মেঘালয়',
    },

    {
        id: 'mizoram',
        en: 'Mizoram',
        hi: 'मिज़ोरम',
        as: 'মিজোৰাম',
    },

    {
        id: 'nagaland',
        en: 'Nagaland',
        hi: 'नागालैंड',
        as: 'নাগালেণ্ড',
    },

    {
        id: 'sikkim',
        en: 'Sikkim',
        hi: 'सिक्किम',
        as: 'ছিক্কিম',
    },

    {
        id: 'tripura',
        en: 'Tripura',
        hi: 'त्रिपुरा',
        as: 'ত্ৰিপুৰা',
    },
]


// ============================================
// NER Cultural Recall Content
// ============================================

export const NER_CULTURAL_CONTENT = [
    {
        id: 'assam-kaziranga',
        stateId: 'assam',
        category: 'place',

        title: {
            en: 'Kaziranga',
            hi: 'काजीरंगा',
            as: 'কাজিৰঙা',
        },

        clue: {
            en: 'A famous national park in Assam.',
            hi: 'असम का एक प्रसिद्ध राष्ट्रीय उद्यान।',
            as: 'অসমৰ এখন বিখ্যাত ৰাষ্ট্ৰীয় উদ্যান।',
        },

        question: {
            en: 'Which NER state is associated with Kaziranga?',
            hi: 'काजीरंगा किस NER राज्य से जुड़ा है?',
            as: 'কাজিৰঙা উত্তৰ-পূৰ্বাঞ্চলৰ কোনখন ৰাজ্যৰ সৈতে জড়িত?',
        },

        answer: 'assam',
    },


    {
        id: 'assam-majuli',
        stateId: 'assam',
        category: 'place',

        title: {
            en: 'Majuli',
            hi: 'माजुली',
            as: 'মাজুলী',
        },

        clue: {
            en: 'A well-known river island associated with Assam.',
            hi: 'असम से जुड़ा एक प्रसिद्ध नदी द्वीप।',
            as: 'অসমৰ সৈতে জড়িত এখন জনাজাত নদীদ্বীপ।',
        },

        question: {
            en: 'Majuli is associated with which state?',
            hi: 'माजुली किस राज्य से जुड़ा है?',
            as: 'মাজুলী কোনখন ৰাজ্যৰ সৈতে জড়িত?',
        },

        answer: 'assam',
    },


    {
        id: 'assam-bihu',
        stateId: 'assam',
        category: 'festival',

        title: {
            en: 'Bihu',
            hi: 'बिहू',
            as: 'বিহু',
        },

        clue: {
            en: 'A major festival tradition of Assam.',
            hi: 'असम की एक प्रमुख त्योहार परंपरा।',
            as: 'অসমৰ এক প্ৰধান উৎসৱৰ পৰম্পৰা।',
        },

        question: {
            en: 'Bihu is strongly associated with which NER state?',
            hi: 'बिहू किस NER राज्य से प्रमुख रूप से जुड़ा है?',
            as: 'বিহু উত্তৰ-পূৰ্বাঞ্চলৰ কোনখন ৰাজ্যৰ সৈতে বিশেষভাৱে জড়িত?',
        },

        answer: 'assam',
    },


    {
        id: 'arunachal-tawang',
        stateId: 'arunachal-pradesh',
        category: 'place',

        title: {
            en: 'Tawang',
            hi: 'तवांग',
            as: 'তৱাং',
        },

        clue: {
            en: 'A well-known Himalayan destination in Arunachal Pradesh.',
            hi: 'अरुणाचल प्रदेश का एक प्रसिद्ध हिमालयी क्षेत्र।',
            as: 'অৰুণাচল প্ৰদেশৰ এটা জনাজাত হিমালয় অঞ্চল।',
        },

        question: {
            en: 'Tawang is in which NER state?',
            hi: 'तवांग किस NER राज्य में है?',
            as: 'তৱাং উত্তৰ-পূৰ্বাঞ্চলৰ কোনখন ৰাজ্যত আছে?',
        },

        answer: 'arunachal-pradesh',
    },


    {
        id: 'manipur-loktak',
        stateId: 'manipur',
        category: 'place',

        title: {
            en: 'Loktak Lake',
            hi: 'लोकटक झील',
            as: 'লোকটাক হ্ৰদ',
        },

        clue: {
            en: 'A famous lake associated with Manipur.',
            hi: 'मणिपुर से जुड़ी एक प्रसिद्ध झील।',
            as: 'মণিপুৰৰ সৈতে জড়িত এখন বিখ্যাত হ্ৰদ।',
        },

        question: {
            en: 'Loktak Lake is associated with which state?',
            hi: 'लोकटक झील किस राज्य से जुड़ी है?',
            as: 'লোকটাক হ্ৰদ কোনখন ৰাজ্যৰ সৈতে জড়িত?',
        },

        answer: 'manipur',
    },


    {
        id: 'meghalaya-shillong',
        stateId: 'meghalaya',
        category: 'place',

        title: {
            en: 'Shillong',
            hi: 'शिलांग',
            as: 'শ্বিলং',
        },

        clue: {
            en: 'The capital city of Meghalaya.',
            hi: 'मेघालय की राजधानी।',
            as: 'মেঘালয়ৰ ৰাজধানী।',
        },

        question: {
            en: 'Shillong is the capital of which NER state?',
            hi: 'शिलांग किस NER राज्य की राजधानी है?',
            as: 'শ্বিলং উত্তৰ-পূৰ্বাঞ্চলৰ কোনখন ৰাজ্যৰ ৰাজধানী?',
        },

        answer: 'meghalaya',
    },


    {
        id: 'mizoram-aizawl',
        stateId: 'mizoram',
        category: 'place',

        title: {
            en: 'Aizawl',
            hi: 'आइज़ोल',
            as: 'আইজল',
        },

        clue: {
            en: 'The capital city of Mizoram.',
            hi: 'मिज़ोरम की राजधानी।',
            as: 'মিজোৰামৰ ৰাজধানী।',
        },

        question: {
            en: 'Aizawl is the capital of which NER state?',
            hi: 'आइज़ोल किस NER राज्य की राजधानी है?',
            as: 'আইজল উত্তৰ-পূৰ্বাঞ্চলৰ কোনখন ৰাজ্যৰ ৰাজধানী?',
        },

        answer: 'mizoram',
    },


    {
        id: 'nagaland-kohima',
        stateId: 'nagaland',
        category: 'place',

        title: {
            en: 'Kohima',
            hi: 'कोहिमा',
            as: 'কোহিমা',
        },

        clue: {
            en: 'The capital city of Nagaland.',
            hi: 'नागालैंड की राजधानी।',
            as: 'নাগালেণ্ডৰ ৰাজধানী।',
        },

        question: {
            en: 'Kohima is the capital of which NER state?',
            hi: 'कोहिमा किस NER राज्य की राजधानी है?',
            as: 'কোহিমা উত্তৰ-পূৰ্বাঞ্চলৰ কোনখন ৰাজ্যৰ ৰাজধানী?',
        },

        answer: 'nagaland',
    },


    {
        id: 'sikkim-tsomgo',
        stateId: 'sikkim',
        category: 'place',

        title: {
            en: 'Tsomgo Lake',
            hi: 'त्सोमगो झील',
            as: 'ছোমগো হ্ৰদ',
        },

        clue: {
            en: 'A high-altitude lake in Sikkim.',
            hi: 'सिक्किम की एक ऊँचाई वाली झील।',
            as: 'ছিক্কিমৰ এখন উচ্চ-উচ্চতাৰ হ্ৰদ।',
        },

        question: {
            en: 'Tsomgo Lake is in which NER state?',
            hi: 'त्सोमगो झील किस NER राज्य में है?',
            as: 'ছোমগো হ্ৰদ উত্তৰ-পূৰ্বাঞ্চলৰ কোনখন ৰাজ্যত আছে?',
        },

        answer: 'sikkim',
    },


    {
        id: 'tripura-ujjayanta',
        stateId: 'tripura',
        category: 'heritage',

        title: {
            en: 'Ujjayanta Palace',
            hi: 'उज्जयंत महल',
            as: 'উজ্জয়ন্ত প্ৰাসাদ',
        },

        clue: {
            en: 'A well-known heritage landmark in Tripura.',
            hi: 'त्रिपुरा का एक प्रसिद्ध विरासत स्थल।',
            as: 'ত্ৰিপুৰাৰ এটা জনাজাত ঐতিহ্যস্থল।',
        },

        question: {
            en: 'Ujjayanta Palace is associated with which state?',
            hi: 'उज्जयंत महल किस राज्य से जुड़ा है?',
            as: 'উজ্জয়ন্ত প্ৰাসাদ কোনখন ৰাজ্যৰ সৈতে জড়িত?',
        },

        answer: 'tripura',
    },
]


// ============================================
// Fallback Content
// ============================================

export const NER_FALLBACK_CONTENT = {
    id: 'ner-fallback',
    stateId: 'assam',
    category: 'regional',

    title: {
        en: 'North Eastern India',
        hi: 'उत्तर पूर्वी भारत',
        as: 'উত্তৰ-পূব ভাৰত',
    },

    clue: {
        en: 'Explore familiar regional places and traditions.',
        hi: 'परिचित क्षेत्रीय स्थानों और परंपराओं को याद करें।',
        as: 'চিনাকি আঞ্চলিক ঠাই আৰু পৰম্পৰা মনত পেলাওক।',
    },

    question: {
        en: 'Which region are these activities designed to represent?',
        hi: 'ये गतिविधियाँ किस क्षेत्र को दर्शाने के लिए बनाई गई हैं?',
        as: 'এই কাৰ্যকলাপসমূহ কোনটো অঞ্চলক প্ৰতিনিধিত্ব কৰিবলৈ তৈয়াৰ কৰা হৈছে?',
    },

    answer: 'north-east',
}