sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "printinglogbook/model/data"
], function (Controller, AppData) {
    "use strict";

    // Helper: find element by partial ID (UI5 prefixes html: namespace IDs with view ID)
    function $id(sId) {
        return document.querySelector("[id$='--" + sId + "']") || document.getElementById(sId);
    }

    return Controller.extend("printinglogbook.controller.EditLog", {

        onInit: function () {
            this._isEditing = false;
            this._editLogId = null;
            this._currentUom = "Kgs";
            this._scanTimeout = null;

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("EditLog").attachPatternMatched(this._onEditRouteMatched, this);
            oRouter.getRoute("CreateLog").attachPatternMatched(this._onCreateRouteMatched, this);
        },

        _onEditRouteMatched: function (oEvent) {
            this._isEditing = true;
            this._editLogId = oEvent.getParameter("arguments").logId;
            this._pendingAction = "edit";
            this._waitAndSetup();
        },

        _onCreateRouteMatched: function () {
            this._isEditing = false;
            this._editLogId = null;
            this._pendingAction = "create";
            this._waitAndSetup();
        },

        _waitAndSetup: function () {
            var that = this;
            var attempts = 0;
            var maxAttempts = 30;
            function trySetup() {
                attempts++;
                var oForm = $id("plbEditForm");
                var oModel = that.getOwnerComponent().getModel("appData");
                if (oForm && oModel) {
                    that._setupForm();
                    if (that._pendingAction === "edit") {
                        that._loadLogData();
                    } else {
                        that._initNewLog();
                    }
                } else if (attempts < maxAttempts) {
                    setTimeout(trySetup, 250);
                }
            }
            setTimeout(trySetup, 300);
        },

        _setupForm: function () {
            this._renderUserInfo();
            this._populateDropdowns();
            this._attachHandlers();
        },

        _renderUserInfo: function () {
            var oModel = this.getOwnerComponent().getModel("appData");
            if (!oModel) return;
            var sUser = oModel.getProperty("/loggedInUser");

            var oAvatar = $id("plbUserAvatarEdit");
            var oName = $id("plbUserNameEdit");
            if (oAvatar) oAvatar.textContent = sUser.charAt(0);
            if (oName) oName.textContent = sUser;
        },

        _populateDropdowns: function () {
            var oProductSelect = $id("plbFieldProductName");
            if (oProductSelect && oProductSelect.options.length <= 1) {
                AppData.PRODUCT_OPTIONS.forEach(function (opt) {
                    var oOpt = document.createElement("option");
                    oOpt.value = opt;
                    oOpt.textContent = opt;
                    oProductSelect.appendChild(oOpt);
                });
            }

            var oCompanySelect = $id("plbFieldCompanyName");
            if (oCompanySelect && oCompanySelect.options.length <= 1) {
                AppData.COMPANY_OPTIONS.forEach(function (opt) {
                    var oOpt = document.createElement("option");
                    oOpt.value = opt;
                    oOpt.textContent = opt;
                    oCompanySelect.appendChild(oOpt);
                });
            }

            var oOperatorSelect = $id("plbFieldOperatorName");
            if (oOperatorSelect && oOperatorSelect.options.length <= 1) {
                AppData.OPERATOR_OPTIONS.forEach(function (opt) {
                    var oOpt = document.createElement("option");
                    oOpt.value = opt;
                    oOpt.textContent = opt;
                    oOperatorSelect.appendChild(oOpt);
                });
            }
        },

        _attachHandlers: function () {
            var that = this;

            var oDateField = $id("plbFieldDateTime");
            if (oDateField && !oDateField._plbBound) {
                oDateField._plbBound = true;
                oDateField.addEventListener("change", function () {
                    that._calculateShift();
                });
            }

            var oProductField = $id("plbFieldProductName");
            if (oProductField && !oProductField._plbBound) {
                oProductField._plbBound = true;
                oProductField.addEventListener("change", function () {
                    that._onProductChange();
                });
            }

            var oCompanyField = $id("plbFieldCompanyName");
            if (oCompanyField && !oCompanyField._plbBound) {
                oCompanyField._plbBound = true;
                oCompanyField.addEventListener("change", function () {
                    var oEl = $id("plbEditCompany");
                    if (oEl) oEl.textContent = oCompanyField.value || "Select Company";
                });
            }

            var oGrossField = $id("plbFieldGrossWeight");
            if (oGrossField && !oGrossField._plbBound) {
                oGrossField._plbBound = true;
                oGrossField.addEventListener("input", function () {
                    if (!that._isEditing) {
                        that._autoCalculateNet();
                    }
                });
            }

            var oSetToMeBtn = $id("plbSetToMeBtn");
            if (oSetToMeBtn && !oSetToMeBtn._plbBound) {
                oSetToMeBtn._plbBound = true;
                oSetToMeBtn.addEventListener("click", function () {
                    that._setToLoggedInUser();
                });
            }

            var oScanGrossBtn = $id("plbScanGrossBtn");
            if (oScanGrossBtn && !oScanGrossBtn._plbBound) {
                oScanGrossBtn._plbBound = true;
                oScanGrossBtn.addEventListener("click", function (e) {
                    e.preventDefault();
                    that._simulateScan("grossWeight");
                });
            }

            var oScanNetBtn = $id("plbScanNetBtn");
            if (oScanNetBtn && !oScanNetBtn._plbBound) {
                oScanNetBtn._plbBound = true;
                oScanNetBtn.addEventListener("click", function (e) {
                    e.preventDefault();
                    that._simulateScan("netWeight");
                });
            }

            var oCancelBtn = $id("plbCancelEditBtn");
            if (oCancelBtn && !oCancelBtn._plbBound) {
                oCancelBtn._plbBound = true;
                oCancelBtn.addEventListener("click", function () {
                    that._navigateBack();
                });
            }

            var oSaveBtn = $id("plbSaveLogBtn");
            if (oSaveBtn && !oSaveBtn._plbBound) {
                oSaveBtn._plbBound = true;
                oSaveBtn.addEventListener("click", function () {
                    that._saveLog();
                });
            }

            var oBreadHome = $id("plbBreadHomeBtn");
            if (oBreadHome && !oBreadHome._plbBound) {
                oBreadHome._plbBound = true;
                oBreadHome.addEventListener("click", function () {
                    that._navigateBack();
                });
            }
        },

        _initNewLog: function () {
            var oModel = this.getOwnerComponent().getModel("appData");
            var aLogs = oModel.getProperty("/logs") || [];
            var sNewId = "PLB-" + (1000 + aLogs.length + 1);

            var now = new Date();
            var tzOffset = now.getTimezoneOffset() * 60000;
            var localISO = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
            var sShift = this._getShiftFromDateTime(localISO);

            this._setFieldValue("plbFieldId", sNewId);
            this._setFieldValue("plbFieldDateTime", localISO);
            this._setFieldValue("plbFieldShift", sShift);
            this._setSelectValue("plbFieldProductName", "");
            this._setSelectValue("plbFieldCompanyName", "");
            this._setFieldValue("plbFieldBoxNo", "");
            this._setFieldValue("plbFieldBatchNo", "");
            this._setFieldValue("plbFieldRollNo", "");
            this._setFieldValue("plbFieldGrossWeight", "0");
            this._setFieldValue("plbFieldNetWeight", "0");
            this._setFieldValue("plbFieldCounter", "0");
            this._setFieldValue("plbFieldPrice", "0");
            this._setSelectValue("plbFieldOperatorName", oModel.getProperty("/loggedInUser"));
            this._setFieldValue("plbFieldRemark", "");

            var oTitle = $id("plbEditTitle");
            if (oTitle) oTitle.textContent = "Create New Log Entry";
            var oDocId = $id("plbEditDocId");
            if (oDocId) oDocId.textContent = "Draft Document";
            var oCompany = $id("plbEditCompany");
            if (oCompany) oCompany.textContent = "Select Company";

            this._currentUom = "Kgs";
            this._updateUomLabels();
        },

        _loadLogData: function () {
            var oModel = this.getOwnerComponent().getModel("appData");
            var aLogs = oModel.getProperty("/logs") || [];
            var oLog = aLogs.find(function (l) { return l.id === this._editLogId; }.bind(this));

            if (!oLog) {
                this._navigateBack();
                return;
            }

            var sDateTime = oLog.dateTime;
            if (!(sDateTime.indexOf("T") >= 0 && sDateTime.length === 16)) {
                var d = new Date(sDateTime);
                var tzOffset = d.getTimezoneOffset() * 60000;
                sDateTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
            }

            this._setFieldValue("plbFieldId", oLog.id);
            this._setFieldValue("plbFieldDateTime", sDateTime);
            this._setFieldValue("plbFieldShift", oLog.shift);
            this._setSelectValue("plbFieldProductName", oLog.productName);
            this._setSelectValue("plbFieldCompanyName", oLog.companyName);
            this._setFieldValue("plbFieldBoxNo", oLog.boxNo);
            this._setFieldValue("plbFieldBatchNo", oLog.batchNo);
            this._setFieldValue("plbFieldRollNo", oLog.rollNo);
            this._setFieldValue("plbFieldGrossWeight", oLog.grossWeight);
            this._setFieldValue("plbFieldNetWeight", oLog.netWeight);
            this._setFieldValue("plbFieldCounter", oLog.counter);
            this._setFieldValue("plbFieldPrice", oLog.price);
            this._setSelectValue("plbFieldOperatorName", oLog.operatorName);
            this._setFieldValue("plbFieldRemark", oLog.remark || "");

            var oTitle = $id("plbEditTitle");
            if (oTitle) oTitle.textContent = "Edit AWL Packaging eLog";
            var oDocId = $id("plbEditDocId");
            if (oDocId) oDocId.textContent = oLog.id;
            var oCompany = $id("plbEditCompany");
            if (oCompany) oCompany.textContent = oLog.companyName || "Select Company";

            this._currentUom = AppData.PRODUCT_UOM[oLog.productName] || "Kgs";
            this._updateUomLabels();
        },

        _calculateShift: function () {
            var oField = $id("plbFieldDateTime");
            if (!oField || !oField.value) return;
            var sShift = this._getShiftFromDateTime(oField.value);
            this._setFieldValue("plbFieldShift", sShift);
        },

        _getShiftFromDateTime: function (sDateStr) {
            if (!sDateStr) return "Day";
            var oDate = new Date(sDateStr);
            var hours = oDate.getHours();
            return (hours >= 8 && hours < 20) ? "Day" : "Night";
        },

        _onProductChange: function () {
            var oSelect = $id("plbFieldProductName");
            if (!oSelect) return;

            var sProduct = oSelect.value;
            if (sProduct && AppData.PRODUCT_PRICES[sProduct]) {
                this._setFieldValue("plbFieldPrice", AppData.PRODUCT_PRICES[sProduct]);
            }

            this._currentUom = AppData.PRODUCT_UOM[sProduct] || "Kgs";
            this._updateUomLabels();
        },

        _updateUomLabels: function () {
            var sUom = this._currentUom;
            ["plbUomGross", "plbUomNet", "plbUomHint"].forEach(function (sId) {
                var oEl = $id(sId);
                if (oEl) oEl.textContent = sUom;
            });
        },

        _autoCalculateNet: function () {
            var oGross = $id("plbFieldGrossWeight");
            if (!oGross) return;
            var gross = parseFloat(oGross.value) || 0;
            var net = +(gross + 1.0).toFixed(2);
            if (net <= 0) net = 0;
            this._setFieldValue("plbFieldNetWeight", net);
        },

        _setToLoggedInUser: function () {
            var oModel = this.getOwnerComponent().getModel("appData");
            var sUser = oModel.getProperty("/loggedInUser");
            this._setSelectValue("plbFieldOperatorName", sUser);
        },

        _simulateScan: function (sField) {
            var that = this;

            var oOverlay = document.createElement("div");
            oOverlay.className = "plbScannerOverlay";
            oOverlay.id = "plbScannerOverlay";

            var sLabel = sField === "grossWeight" ? "Gross" : "Net";

            oOverlay.innerHTML =
                '<div style="text-align:center;margin-bottom:24px">' +
                '<h3 class="plbScannerTitle">Scale Camera Integration</h3>' +
                '<p class="plbScannerSubtitle">Simulating hardware read for ' + sLabel + ' Measurement...</p>' +
                '</div>' +
                '<div class="plbScannerBox">' +
                '<div class="plbScanline"></div>' +
                '<svg class="plbScanBoxIcon plbSvgFill" viewBox="0 0 24 24"><path d="M4 6h2v2H4zm0 5h2v2H4zm0 5h2v2H4zm16-8V6H8.02v2H20v10H8.02v-2H6v2c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 7h-2v2h2zm0-5h-2v2h2zm0 5h-2v2h2z"/></svg>' +
                '</div>' +
                '<button class="plbScannerCancelBtn" id="plbScannerCancelBtn">Cancel Scan</button>';

            document.body.appendChild(oOverlay);

            document.getElementById("plbScannerCancelBtn").onclick = function () {
                that._cancelScan();
            };

            this._scanTimeout = setTimeout(function () {
                var randomWeight = +(Math.random() * (22.50 - 21.00) + 21.00).toFixed(2);
                var sFieldId = sField === "grossWeight" ? "plbFieldGrossWeight" : "plbFieldNetWeight";
                that._setFieldValue(sFieldId, randomWeight);

                if (sField === "grossWeight" && !that._isEditing) {
                    var netVal = +(randomWeight + 1.0).toFixed(2);
                    that._setFieldValue("plbFieldNetWeight", netVal);
                }

                that._closeScannerOverlay();
            }, 2000);
        },

        _cancelScan: function () {
            if (this._scanTimeout) {
                clearTimeout(this._scanTimeout);
                this._scanTimeout = null;
            }
            this._closeScannerOverlay();
        },

        _closeScannerOverlay: function () {
            var oOverlay = document.getElementById("plbScannerOverlay");
            if (oOverlay) oOverlay.remove();
        },

        _saveLog: function () {
            var aRequired = [
                "plbFieldDateTime", "plbFieldProductName", "plbFieldCompanyName",
                "plbFieldBoxNo", "plbFieldBatchNo", "plbFieldRollNo",
                "plbFieldGrossWeight", "plbFieldNetWeight", "plbFieldCounter",
                "plbFieldPrice", "plbFieldOperatorName"
            ];

            var bValid = true;
            aRequired.forEach(function (sId) {
                var oEl = $id(sId);
                if (!oEl || !oEl.value || oEl.value === "0") {
                    bValid = false;
                    if (oEl) oEl.style.borderColor = "#bb0000";
                } else {
                    if (oEl) oEl.style.borderColor = "";
                }
            });

            var oCounter = $id("plbFieldCounter");
            if (oCounter && (parseInt(oCounter.value, 10) || 0) < 1) {
                bValid = false;
                oCounter.style.borderColor = "#bb0000";
            }

            if (!bValid) return;

            var oFormData = {
                id: this._getFieldValue("plbFieldId"),
                dateTime: this._getFieldValue("plbFieldDateTime"),
                shift: this._getFieldValue("plbFieldShift"),
                productName: this._getSelectValue("plbFieldProductName"),
                boxNo: this._getFieldValue("plbFieldBoxNo").toUpperCase(),
                companyName: this._getSelectValue("plbFieldCompanyName"),
                grossWeight: parseFloat(this._getFieldValue("plbFieldGrossWeight")) || 0,
                netWeight: parseFloat(this._getFieldValue("plbFieldNetWeight")) || 0,
                counter: parseInt(this._getFieldValue("plbFieldCounter"), 10) || 0,
                batchNo: this._getFieldValue("plbFieldBatchNo").toUpperCase(),
                rollNo: this._getFieldValue("plbFieldRollNo").toUpperCase(),
                price: parseFloat(this._getFieldValue("plbFieldPrice")) || 0,
                operatorName: this._getSelectValue("plbFieldOperatorName"),
                remark: this._getFieldValue("plbFieldRemark")
            };

            var oModel = this.getOwnerComponent().getModel("appData");
            var aLogs = oModel.getProperty("/logs") || [];

            if (this._isEditing) {
                aLogs = aLogs.map(function (log) {
                    return log.id === oFormData.id ? oFormData : log;
                });
            } else {
                aLogs.unshift(oFormData);
            }

            oModel.setProperty("/logs", aLogs);
            this._navigateBack();
        },

        _navigateBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        },

        // --- DOM Helpers ---
        _setFieldValue: function (sId, sValue) {
            var oEl = $id(sId);
            if (oEl) oEl.value = sValue;
        },

        _getFieldValue: function (sId) {
            var oEl = $id(sId);
            return oEl ? oEl.value : "";
        },

        _setSelectValue: function (sId, sValue) {
            var oEl = $id(sId);
            if (oEl) oEl.value = sValue;
        },

        _getSelectValue: function (sId) {
            var oEl = $id(sId);
            return oEl ? oEl.value : "";
        }
    });
});
