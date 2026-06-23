/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["printinglogbook/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
