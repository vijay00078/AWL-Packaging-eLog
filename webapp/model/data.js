sap.ui.define([], function () {
    "use strict";

    return {
        PRODUCT_OPTIONS: ["1 Ltr Pouch", "4 Ltr Pouch", "5 Ltr Pouch"],

        PRODUCT_PRICES: {
            "1 Ltr Pouch": 215,
            "4 Ltr Pouch": 850,
            "5 Ltr Pouch": 1070
        },

        PRODUCT_UOM: {
            "1 Ltr Pouch": "Kgs",
            "4 Ltr Pouch": "Cartons",
            "5 Ltr Pouch": "Pieces"
        },

        COMPANY_OPTIONS: ["Vishakha", "Fortune", "XYZ"],

        OPERATOR_OPTIONS: ["Pappu", "Bani", "Sujeeth", "Amit", "Rahul", "Sandhya", "Soniya"],

        CURRENT_LOGGED_IN_USER: "Pappu",

        MOCK_DATA: [
            {
                id: "PLB-1001",
                dateTime: "2026-05-30T08:00",
                shift: "Day",
                productName: "1 Ltr Pouch",
                boxNo: "0770-17",
                companyName: "Vishakha",
                grossWeight: 21.91,
                netWeight: 20.91,
                counter: 2712,
                batchNo: "ABM030150",
                rollNo: "B1",
                price: 215,
                operatorName: "Pappu",
                remark: ""
            },
            {
                id: "PLB-1002",
                dateTime: "2026-05-30T08:20",
                shift: "Day",
                productName: "1 Ltr Pouch",
                boxNo: "0778-14",
                companyName: "Vishakha",
                grossWeight: 21.39,
                netWeight: 20.39,
                counter: 2704,
                batchNo: "ABM030150",
                rollNo: "B2",
                price: 215,
                operatorName: "Bani",
                remark: ""
            },
            {
                id: "PLB-1003",
                dateTime: "2026-05-30T10:20",
                shift: "Day",
                productName: "4 Ltr Pouch",
                boxNo: "0363-10",
                companyName: "Fortune",
                grossWeight: 21.83,
                netWeight: 20.83,
                counter: 3780,
                batchNo: "ABM030151",
                rollNo: "B6",
                price: 850,
                operatorName: "Sujeeth",
                remark: ""
            },
            {
                id: "PLB-1004",
                dateTime: "2026-05-30T11:00",
                shift: "Day",
                productName: "5 Ltr Pouch",
                boxNo: "0363-1",
                companyName: "XYZ",
                grossWeight: 21.74,
                netWeight: 20.74,
                counter: 2689,
                batchNo: "ABM030152",
                rollNo: "B7",
                price: 1070,
                operatorName: "Amit",
                remark: ""
            }
        ]
    };
});
