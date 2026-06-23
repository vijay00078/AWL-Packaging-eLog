sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "printinglogbook/model/data"
], function (Controller, JSONModel, AppData) {
    "use strict";

    return Controller.extend("printinglogbook.controller.App", {
        onInit: function () {
            // Create the main JSON model with mock data
            var oModel = new JSONModel({
                logs: JSON.parse(JSON.stringify(AppData.MOCK_DATA)),
                productOptions: AppData.PRODUCT_OPTIONS,
                companyOptions: AppData.COMPANY_OPTIONS,
                operatorOptions: AppData.OPERATOR_OPTIONS,
                loggedInUser: AppData.CURRENT_LOGGED_IN_USER,
                productPrices: AppData.PRODUCT_PRICES,
                productUom: AppData.PRODUCT_UOM,
                showPwaInstallPrompt: false
            });
            oModel.setSizeLimit(1000);
            this.getOwnerComponent().setModel(oModel, "appData");

            // Register globally so the popup's inline HTML 'onclick' can reach it
            window.plbAppController = this;

            // Show PWA install prompt after a short delay (only if not already installed)
            var that = this;
            setTimeout(function() {
                that._checkAndShowPwaPrompt();
            }, 2000);
        },

        _checkAndShowPwaPrompt: function () {
            // Don't show if already running as installed PWA
            var isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                               window.navigator.standalone === true;
            if (isStandalone) return;

            // Don't show if user already dismissed it today
            var dismissedDate = localStorage.getItem('plb_pwa_dismissed');
            if (dismissedDate) {
                var dismissed = new Date(dismissedDate);
                var now = new Date();
                var hoursSince = (now - dismissed) / (1000 * 60 * 60);
                if (hoursSince < 1) return; // Don't show again for at least 1 hour
            }

            // Show the install prompt
            var oModel = this.getOwnerComponent().getModel("appData");
            oModel.setProperty("/showPwaInstallPrompt", true);
        },

        dismissPwaPrompt: function () {
            var oModel = this.getOwnerComponent().getModel("appData");
            oModel.setProperty("/showPwaInstallPrompt", false);
            localStorage.setItem('plb_pwa_dismissed', new Date().toISOString());
        },

        formatPwaInstallPrompt: function (bShow) {
            if (!bShow) {
                return '<div style="display:none;"></div>';
            }

            // Detect platform for tailored instructions
            var ua = navigator.userAgent || '';
            var isIOS = /iPad|iPhone|iPod/.test(ua);
            var isAndroid = /Android/.test(ua);

            if (!isIOS && !isAndroid && !/Mobi/i.test(ua)) {
                // Do not show install prompt on desktop
                return '<div style="display:none;"></div>';
            }

            var step1Icon, step1Text, step2Icon, step2Text, step3Icon, step3Text;

            if (isIOS) {
                step1Icon = '<svg style="width:1.25rem;height:1.25rem" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>';
                step1Text = 'Open in <b>Safari</b> browser';
                step2Icon = '<svg style="width:1.25rem;height:1.25rem" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" /></svg>';
                step2Text = 'Tap <b>Share</b> in navigation bar';
                step3Icon = '<svg style="width:1.25rem;height:1.25rem" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
                step3Text = 'Select <b>Add to Home Screen</b>';
            } else {
                // Default to Android/Chrome logic
                step1Icon = '<svg style="width:1.25rem;height:1.25rem" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>';
                step1Text = 'Open in <b>Chrome</b> browser';
                step2Icon = '<svg style="width:1.25rem;height:1.25rem" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>';
                step2Text = 'Tap <b>⋮ Menu</b> at the top right';
                step3Icon = '<svg style="width:1.25rem;height:1.25rem" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>';
                step3Text = 'Select <b>Install App</b> or <b>Add to Home Screen</b>';
            }

            return '<div class="plbPwaOverlay" onclick="window.plbAppController.dismissPwaPrompt()">' +
                   '  <div class="plbPwaCard" onclick="event.stopPropagation()">' +
                   '    <button onclick="window.plbAppController.dismissPwaPrompt()" class="plbPwaCloseBtn">' +
                   '      <svg style="width:1rem;height:1rem" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>' +
                   '    </button>' +
                   '    <div class="plbPwaHeader">' +
                   '      <div class="plbPwaIconBox">' +
                   '        <img src="images/icon.svg" alt="AWL eLog Logo" />' +
                   '      </div>' +
                   '      <h3 class="plbPwaTitle">Install AWL Packaging eLog on your HomeScreen</h3>' +
                   '    </div>' +
                   '    <p class="plbPwaSubtitle">This site has app functionality. Add it to your Home Screen for a better experience and easy access.</p>' +
                   '    <div class="plbPwaSteps">' +
                   '      <div class="plbPwaStep">' +
                   '        <div class="plbPwaStepIcon">' + step1Icon + '</div>' +
                   '        <span class="plbPwaStepText"><span class="plbPwaStepNum">1.</span> ' + step1Text + '</span>' +
                   '      </div>' +
                   '      <div class="plbPwaStep">' +
                   '        <div class="plbPwaStepIcon">' + step2Icon + '</div>' +
                   '        <span class="plbPwaStepText"><span class="plbPwaStepNum">2.</span> ' + step2Text + '</span>' +
                   '      </div>' +
                   '      <div class="plbPwaStep">' +
                   '        <div class="plbPwaStepIcon">' + step3Icon + '</div>' +
                   '        <span class="plbPwaStepText"><span class="plbPwaStepNum">3.</span> ' + step3Text + '</span>' +
                   '      </div>' +
                   '    </div>' +
                   '    <button onclick="window.plbAppController.dismissPwaPrompt()" class="plbPwaBtn">Got it!</button>' +
                   '  </div>' +
                   '</div>';
        }
    });
});