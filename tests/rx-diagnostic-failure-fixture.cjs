'use strict';
// Intentionally failing test fixture. It is executed ONLY by the dedicated
// RX diagnostic regression test, never by production or the default suite.
console.error('RX controlled failure fixture');
process.exitCode=7;
