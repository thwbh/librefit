'use strict';
var __awaiter =
	(this && this.__awaiter) ||
	function (thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P
				? value
				: new P(function (resolve) {
						resolve(value);
					});
		}
		return new (P || (P = Promise))(function (resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator['throw'](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
var __generator =
	(this && this.__generator) ||
	function (thisArg, body) {
		var _ = {
				label: 0,
				sent: function () {
					if (t[0] & 1) throw t[1];
					return t[1];
				},
				trys: [],
				ops: []
			},
			f,
			y,
			t,
			g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
		return (
			(g.next = verb(0)),
			(g['throw'] = verb(1)),
			(g['return'] = verb(2)),
			typeof Symbol === 'function' &&
				(g[Symbol.iterator] = function () {
					return this;
				}),
			g
		);
		function verb(n) {
			return function (v) {
				return step([n, v]);
			};
		}
		function step(op) {
			if (f) throw new TypeError('Generator is already executing.');
			while ((g && ((g = 0), op[0] && (_ = 0)), _))
				try {
					if (
						((f = 1),
						y &&
							(t =
								op[0] & 2
									? y['return']
									: op[0]
										? y['throw'] || ((t = y['return']) && t.call(y), 0)
										: y.next) &&
							!(t = t.call(y, op[1])).done)
					)
						return t;
					if (((y = 0), t)) op = [op[0] & 2, t.value];
					switch (op[0]) {
						case 0:
						case 1:
							t = op;
							break;
						case 4:
							_.label++;
							return { value: op[1], done: false };
						case 5:
							_.label++;
							y = op[1];
							op = [0];
							continue;
						case 7:
							op = _.ops.pop();
							_.trys.pop();
							continue;
						default:
							if (
								!((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
								(op[0] === 6 || op[0] === 2)
							) {
								_ = 0;
								continue;
							}
							if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
								_.label = op[1];
								break;
							}
							if (op[0] === 6 && _.label < t[1]) {
								_.label = t[1];
								t = op;
								break;
							}
							if (t && _.label < t[2]) {
								_.label = t[2];
								_.ops.push(op);
								break;
							}
							if (t[2]) _.ops.pop();
							_.trys.pop();
							continue;
					}
					op = body.call(thisArg, _);
				} catch (e) {
					op = [6, e];
					y = 0;
				} finally {
					f = t = 0;
				}
			if (op[0] & 5) throw op[1];
			return { value: op[0] ? op[1] : void 0, done: true };
		}
	};
Object.defineProperty(exports, '__esModule', { value: true });
var app_1 = require('../fixtures/app');
var welcome_1 = require('../pages/welcome');
/**
 * Onboarding e2e tests.
 *
 * Spec:        openspec/specs/onboarding/spec.md
 * Conventions: _conv-animations (welcome entrance), _conv-modals (n/a for wizard)
 */
app_1.test.describe('Welcome screen', function () {
	(0, app_1.test)(
		'[OB-001] [ANI-001] welcome screen renders for first launch with no profile',
		function (_a) {
			return __awaiter(void 0, [_a], void 0, function (_b) {
				var welcome, _i, _c, card;
				var page = _b.page;
				return __generator(this, function (_d) {
					switch (_d.label) {
						case 0:
							welcome = new welcome_1.WelcomePage(page);
							return [4 /*yield*/, (0, app_1.expect)(page).toHaveTitle(/welcome to librefit/i)];
						case 1:
							_d.sent();
							// Required elements per spec
							return [4 /*yield*/, (0, app_1.expect)(welcome.logo).toBeVisible()];
						case 2:
							// Required elements per spec
							_d.sent();
							return [4 /*yield*/, (0, app_1.expect)(welcome.tagline).toBeVisible()];
						case 3:
							_d.sent();
							return [4 /*yield*/, (0, app_1.expect)(welcome.privacyBadge).toBeVisible()];
						case 4:
							_d.sent();
							return [4 /*yield*/, (0, app_1.expect)(welcome.versionLine).toBeVisible()];
						case 5:
							_d.sent();
							return [4 /*yield*/, (0, app_1.expect)(welcome.getStartedButton).toBeEnabled()];
						case 6:
							_d.sent();
							(_i = 0), (_c = welcome.featureCards);
							_d.label = 7;
						case 7:
							if (!(_i < _c.length)) return [3 /*break*/, 10];
							card = _c[_i];
							return [4 /*yield*/, (0, app_1.expect)(card).toBeVisible()];
						case 8:
							_d.sent();
							_d.label = 9;
						case 9:
							_i++;
							return [3 /*break*/, 7];
						case 10:
							return [2 /*return*/];
					}
				});
			});
		}
	);
	(0, app_1.test)('[OB-002] Get Started navigates to /setup', function (_a) {
		return __awaiter(void 0, [_a], void 0, function (_b) {
			var welcome;
			var page = _b.page;
			return __generator(this, function (_c) {
				switch (_c.label) {
					case 0:
						welcome = new welcome_1.WelcomePage(page);
						return [4 /*yield*/, welcome.clickGetStarted()];
					case 1:
						_c.sent();
						return [4 /*yield*/, (0, app_1.expect)(page).toHaveURL(/\/setup$/)];
					case 2:
						_c.sent();
						// Setup page renders its own sr-only heading.
						return [
							4 /*yield*/,
							(0, app_1.expect)(page.getByRole('heading', { name: 'Setup Wizard' })).toBeAttached()
						];
					case 3:
						// Setup page renders its own sr-only heading.
						_c.sent();
						return [4 /*yield*/, (0, app_1.expect)(page.getByText('Step 1 of 5')).toBeVisible()];
					case 4:
						_c.sent();
						return [
							4 /*yield*/,
							(0, app_1.expect)(page.getByText('Body Parameters')).toBeVisible()
						];
					case 5:
						_c.sent();
						return [2 /*return*/];
				}
			});
		});
	});
});
app_1.test.describe('Route guard', function () {
	// [OB-003] Direct access to protected route redirects to welcome
	(0, app_1.test)('[OB-003] direct access to / redirects to /welcome', function (_a) {
		return __awaiter(void 0, [_a], void 0, function (_b) {
			var page = _b.page;
			return __generator(this, function (_c) {
				switch (_c.label) {
					case 0:
						// With no profile in the freshly-reset DB, the layout guard should
						// redirect any (app) route to /welcome.
						return [4 /*yield*/, page.goto('/')];
					case 1:
						// With no profile in the freshly-reset DB, the layout guard should
						// redirect any (app) route to /welcome.
						_c.sent();
						return [4 /*yield*/, (0, app_1.expect)(page).toHaveURL(/\/welcome$/)];
					case 2:
						_c.sent();
						return [2 /*return*/];
				}
			});
		});
	});
	// [OB-004] /welcome and /setup remain accessible without a profile
	(0, app_1.test)('[OB-004] /setup is accessible without a profile', function (_a) {
		return __awaiter(void 0, [_a], void 0, function (_b) {
			var page = _b.page;
			return __generator(this, function (_c) {
				switch (_c.label) {
					case 0:
						return [4 /*yield*/, page.goto('/setup')];
					case 1:
						_c.sent();
						return [4 /*yield*/, (0, app_1.expect)(page).toHaveURL(/\/setup$/)];
					case 2:
						_c.sent();
						return [
							4 /*yield*/,
							(0, app_1.expect)(page.getByText('Body Parameters')).toBeVisible()
						];
					case 3:
						_c.sent();
						return [2 /*return*/];
				}
			});
		});
	});
});
app_1.test.describe('Setup wizard happy path', function () {
	// [OB-005] Valid body information advances wizard
	// [OB-006] Sex must be explicitly selected
	// [OB-007] Avatar defaults to name seed
	// [OB-008] Activity level selection advances to results
	// [OB-009] [OB-010] [OB-011] Recommendation by BMI category
	// [OB-013] Rate selection for weight loss
	// [OB-015] Successful setup completion
	// [OB-017] Atomic target creation
	app_1.test.skip('completes 5-step wizard end-to-end and lands on dashboard', function () {
		return __awaiter(void 0, void 0, void 0, function () {
			return __generator(this, function (_a) {
				return [2 /*return*/];
			});
		});
	});
	// [OB-012] Low-normal BMI alert
	app_1.test.skip('low-normal BMI shows special GAIN alert on Step 3', function () {
		return __awaiter(void 0, void 0, void 0, function () {
			return __generator(this, function (_a) {
				return [2 /*return*/];
			});
		});
	});
	// [OB-014] Step 4 title changes for HOLD users
	app_1.test.skip(
		'Step 4 title is "Select Your Target Weight" when recommendation is HOLD',
		function () {
			return __awaiter(void 0, void 0, void 0, function () {
				return __generator(this, function (_a) {
					return [2 /*return*/];
				});
			});
		}
	);
	// [OB-016] Setup failure with rollback
	app_1.test.skip('setup failure shows retry without partial persistence', function () {
		return __awaiter(void 0, void 0, void 0, function () {
			return __generator(this, function (_a) {
				return [2 /*return*/];
			});
		});
	});
});
