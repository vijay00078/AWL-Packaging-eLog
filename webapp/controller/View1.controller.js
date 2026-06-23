sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "printinglogbook/model/data",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter"
], function (Controller, JSONModel, AppData, Filter, FilterOperator, Sorter) {
    "use strict";

    function $id(sId) {
        return document.querySelector("[id$='--" + sId + "']") || document.getElementById(sId);
    }

    return Controller.extend("printinglogbook.controller.View1", {

        onInit: function () {
            this._oViewModel = new JSONModel({
                totalCounter: 0,
                totalValue: 0,
                weightYield: 0,
                totalNetWeight: 0,
                totalGrossWeight: 0,
                filteredCount: 0,
                productDistribution: []
            });
            this.getView().setModel(this._oViewModel, "viewModel");

            this._logToDelete = null;
            this._bRendered = false;

            this.getOwnerComponent().getRouter().getRoute("RouteView1").attachPatternMatched(this._onRouteMatched, this);
        },

        onAfterRendering: function () {
            this._bRendered = true;
            this._waitAndRender();
        },

        _onRouteMatched: function () {
            this._waitAndRender();
        },

        _waitAndRender: function () {
            var that = this;
            var attempts = 0;
            var maxAttempts = 30;
            function tryRender() {
                attempts++;
                var oModel = that.getOwnerComponent().getModel("appData");
                if (oModel) {
                    that._renderAll();
                } else if (attempts < maxAttempts) {
                    setTimeout(tryRender, 250);
                }
            }
            setTimeout(tryRender, 300);
        },

        _renderAll: function () {
            this._renderPlantFilter();
            
            // For initial render, we can apply current filters (which sets table bindings & KPIs)
            var oInput = $id("plbSearchField");
            var sQuery = oInput ? oInput.value : "";
            this._applySearchFilter(sQuery);
            
            this._renderUserInfo();
            this._attachSearchHandler();
            this._attachGroupHandler();
            this._attachCreateHandler();
        },

        _renderPlantFilter: function () {
            var that = this;
            var oSelect = $id("plbPlantFilterSelect");
            if (!oSelect) return;
            
            if (!oSelect._plbBound) {
                oSelect.innerHTML = '<option value="All">All Plants / Companies</option>';
                AppData.COMPANY_OPTIONS.forEach(function (opt) {
                    var option = document.createElement("option");
                    option.value = opt;
                    option.textContent = opt;
                    oSelect.appendChild(option);
                });

                oSelect.addEventListener("change", function () {
                    that._sCurrentPlant = oSelect.value;
                    var oInput = $id("plbSearchField");
                    var sQuery = oInput ? oInput.value : "";
                    that._applySearchFilter(sQuery);
                });
                oSelect._plbBound = true;
            }
        },

        _renderUserInfo: function () {
            var oModel = this.getOwnerComponent().getModel("appData");
            if (!oModel) return;
            var sUser = oModel.getProperty("/loggedInUser");

            var oAvatar = $id("plbUserAvatarOverview");
            var oName = $id("plbUserNameOverview");
            if (oAvatar) oAvatar.textContent = sUser.charAt(0);
            if (oName) oName.textContent = sUser;
        },

        _computeKPIs: function (aLogsParam) {
            var oModel = this.getOwnerComponent().getModel("appData");
            if (!oModel) return;
            var aLogs = Array.isArray(aLogsParam) ? aLogsParam : (oModel.getProperty("/logs") || []);

            var totalCounter = 0, totalGross = 0, totalNet = 0, totalPrice = 0;
            var oCounts = {};

            aLogs.forEach(function (log) {
                totalCounter += log.counter;
                totalGross += log.grossWeight;
                totalNet += log.netWeight;
                totalPrice += log.price;
                oCounts[log.productName] = (oCounts[log.productName] || 0) + 1;
            });

            var weightYield = totalGross === 0 ? 0 : (totalNet / totalGross) * 100;

            var aDistribution = Object.keys(oCounts).map(function (name) {
                return { name: name, count: oCounts[name] };
            }).sort(function (a, b) { return b.count - a.count; });

            this._setTextById("plbKpiTotalCounter", totalCounter.toLocaleString("en-IN"));
            this._setTextById("plbKpiTotalValue", "₹" + totalPrice.toLocaleString("en-IN"));
            this._setTextById("plbKpiFromLogs", "From " + aLogs.length + " Logs");
            this._setTextById("plbKpiWeightYield", weightYield.toFixed(1) + "%");
            this._setTextById("plbKpiNetWeight", "Net: " + totalNet.toFixed(1) + " kg");
            this._setTextById("plbKpiGrossWeight", "Gross: " + totalGross.toFixed(1) + " kg");

            var oYieldBar = $id("plbKpiYieldBar");
            if (oYieldBar) {
                oYieldBar.style.width = Math.min(weightYield, 100) + "%";
                oYieldBar.className = "plbKpiBar";
                if (weightYield < 80) {
                    oYieldBar.classList.add("plbKpiBarRed");
                } else if (weightYield < 95) {
                    oYieldBar.classList.add("plbKpiBarOrange");
                } else {
                    oYieldBar.classList.add("plbKpiBarGreen");
                }
            }

            this._productDistribution = aDistribution;
            this._totalLogs = aLogs.length;
        },

        _renderProductDistribution: function () {
            var oContainer = $id("plbProductDistribution");
            if (!oContainer) return;

            var aDistribution = this._productDistribution || [];
            var totalLogs = this._totalLogs || 1;
            var sHtml = "";

            aDistribution.slice(0, 3).forEach(function (item) {
                var pct = (item.count / totalLogs) * 100;
                sHtml += '<div class="plbDistItem">' +
                    '<div class="plbDistHeader">' +
                    '<span class="plbDistName">' + this._escapeHtml(item.name) + '</span>' +
                    '<span class="plbDistCount">' + item.count + '</span>' +
                    '</div>' +
                    '<div class="plbDistBar"><div class="plbDistBarFill" style="width:' + pct + '%"></div></div>' +
                    '</div>';
            }.bind(this));

            oContainer.innerHTML = sHtml;
        },

        _attachSearchHandler: function () {
            var that = this;
            var oInput = $id("plbSearchField");
            if (!oInput || oInput._plbBound) return;
            oInput._plbBound = true;

            oInput.addEventListener("input", function () {
                that._applySearchFilter(oInput.value);
            });
        },

        _applySearchFilter: function (sQuery) {
            var aFilters = [];
            if (sQuery) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("productName", FilterOperator.Contains, sQuery),
                        new Filter("companyName", FilterOperator.Contains, sQuery),
                        new Filter("operatorName", FilterOperator.Contains, sQuery),
                        new Filter("batchNo", FilterOperator.Contains, sQuery),
                        new Filter("rollNo", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }

            var sPlant = this._sCurrentPlant || "All";
            if (sPlant !== "All") {
                aFilters.push(new Filter("companyName", FilterOperator.EQ, sPlant));
            }

            var oTable = this.byId("logTable");
            if (oTable) {
                var oBinding = oTable.getBinding("items");
                if (oBinding) {
                    var finalFilter = [];
                    if (aFilters.length > 0) {
                        finalFilter = [new Filter({ filters: aFilters, and: true })];
                    }
                    oBinding.filter(finalFilter);
                    this._setTextById("plbTableCount", "Standard Items (" + oBinding.getLength() + ")");
                    
                    var aContexts = oBinding.getContexts(0, oBinding.getLength());
                    var aLogs = aContexts.map(function(c) { return c.getObject(); });
                    this._computeKPIs(aLogs);
                    this._renderProductDistribution();
                }
            }
        },

        _attachGroupHandler: function () {
            var that = this;
            var oSelect = $id("plbGroupSelect");
            if (!oSelect || oSelect._plbBound) return;
            oSelect._plbBound = true;

            oSelect.addEventListener("change", function () {
                that._applyGroupFilter(oSelect.value);
            });
        },

        _applyGroupFilter: function (sField) {
            var oTable = this.byId("logTable");
            if (!oTable) return;
            var oBinding = oTable.getBinding("items");
            if (!oBinding) return;

            if (sField === "none" || !sField) {
                oBinding.sort([]);
                return;
            }

            var sPath = sField;
            if (sField === "date") {
                sPath = "dateTime";
            }

            var oSorter = new Sorter(sPath, false, function(oContext) {
                var vValue = oContext.getProperty(sPath);
                var sKey = vValue;
                if (sField === "date") {
                    var d = new Date(vValue);
                    sKey = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                } else {
                    sKey = String(vValue || "Unknown");
                }
                return {
                    key: sKey,
                    text: sKey
                };
            });
            oBinding.sort([oSorter]);
        },

        _attachCreateHandler: function () {
            var that = this;
            var oBtn = $id("plbCreateEntryBtn");
            if (!oBtn || oBtn._plbBound) return;
            oBtn._plbBound = true;

            oBtn.addEventListener("click", function () {
                that.getOwnerComponent().getRouter().navTo("CreateLog");
            });
        },

        onEditAction: function (oEvent) {
            var sLogId = oEvent.getSource().data("logId");
            this.getOwnerComponent().getRouter().navTo("EditLog", { logId: sLogId });
        },

        onDeleteAction: function (oEvent) {
            var sLogId = oEvent.getSource().data("logId");
            var oModel = this.getOwnerComponent().getModel("appData");
            var aLogs = oModel.getProperty("/logs") || [];
            var oLog = aLogs.find(function (l) { return l.id === sLogId; });
            if (!oLog) return;

            this._logToDelete = oLog;
            this._showDeleteDialog(oLog);
        },

        _showDeleteDialog: function (oLog) {
            var that = this;

            var oOverlay = document.createElement("div");
            oOverlay.className = "plbDeleteOverlay";
            oOverlay.id = "plbDeleteOverlay";
            oOverlay.innerHTML =
                '<div class="plbDeleteDialog">' +
                '<div class="plbDeleteDialogHeader">' +
                '<svg class="plbDeleteDialogIcon plbSvgFill" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>' +
                '<span class="plbDeleteDialogTitle">Confirm Deletion</span>' +
                '</div>' +
                '<div class="plbDeleteDialogBody">' +
                '<p class="plbDeleteMsg">Are you sure you want to delete this log entry?</p>' +
                '<p class="plbDeleteDetail">Product: ' + this._escapeHtml(oLog.productName) + ' - ' + this._escapeHtml(oLog.companyName) + '</p>' +
                '<p class="plbDeleteWarn">This action cannot be undone.</p>' +
                '</div>' +
                '<div class="plbDeleteDialogFooter">' +
                '<button class="plbDeleteCancelBtn" id="plbDeleteCancelBtn">Cancel</button>' +
                '<button class="plbDeleteConfirmBtn" id="plbDeleteConfirmBtn">Delete Record</button>' +
                '</div>' +
                '</div>';

            document.body.appendChild(oOverlay);

            document.getElementById("plbDeleteCancelBtn").onclick = function () {
                that._cancelDelete();
            };
            document.getElementById("plbDeleteConfirmBtn").onclick = function () {
                that._confirmDelete();
            };
        },

        _cancelDelete: function () {
            this._logToDelete = null;
            var oOverlay = document.getElementById("plbDeleteOverlay");
            if (oOverlay) oOverlay.remove();
        },

        _confirmDelete: function () {
            if (!this._logToDelete) return;
            var sId = this._logToDelete.id;
            var oModel = this.getOwnerComponent().getModel("appData");
            var aLogs = oModel.getProperty("/logs") || [];
            var aNew = aLogs.filter(function (l) { return l.id !== sId; });
            oModel.setProperty("/logs", aNew);

            this._logToDelete = null;
            var oOverlay = document.getElementById("plbDeleteOverlay");
            if (oOverlay) oOverlay.remove();

            var oInput = $id("plbSearchField");
            var sQuery = oInput ? oInput.value : "";
            this._applySearchFilter(sQuery);
        },

        _setTextById: function (sId, sText) {
            var oEl = $id(sId);
            if (oEl) oEl.textContent = sText;
        },

        _escapeHtml: function (sStr) {
            if (!sStr) return "";
            var oDiv = document.createElement("div");
            oDiv.appendChild(document.createTextNode(sStr));
            return oDiv.innerHTML;
        },

        // --- Formatters for sap.m.Table ---

        formatDateMain: function (sDateTime) {
            if (!sDateTime) return "";
            var oDate = new Date(sDateTime);
            return oDate.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" });
        },
        formatTimeRow: function (sDateTime) {
            if (!sDateTime) return "";
            var oDate = new Date(sDateTime);
            return oDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
        },
        formatShiftBadge: function (oLog) {
            if (!oLog) return "";
            var sClass = "plbShiftBadge " + (oLog.shift === "Day" ? "plbShiftDay" : "plbShiftNight");
            return '<div class="' + sClass + '">' + oLog.shift + ' Shift</div>';
        },
        formatGrossWeight: function(oLog) {
            if (!oLog) return "";
            var sUom = AppData.PRODUCT_UOM[oLog.productName] || "Kgs";
            return oLog.grossWeight.toFixed(2) + " " + sUom;
        },
        formatNetWeightNum: function(oLog) {
            if (!oLog) return "";
            return oLog.netWeight.toFixed(2);
        },
        formatNetWeightUnit: function(oLog) {
            if (!oLog) return "";
            return AppData.PRODUCT_UOM[oLog.productName] || "Kgs";
        },
        formatNetState: function(oLog) {
            if (!oLog) return "None";
            return oLog.netWeight < oLog.grossWeight ? "Error" : "Success";
        },
        formatCounter: function(iCounter) {
            return iCounter ? iCounter.toLocaleString("en-IN") : "0";
        },
        formatPrice: function(fPrice) {
            return fPrice ? "₹" + fPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "₹0.00";
        },
        formatAvatar: function(sName) {
            return sName ? sName.charAt(0).toUpperCase() : "";
        }
    });
});