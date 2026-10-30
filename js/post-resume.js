/**
 * Local PostResume form.
 * Applications POST to HRPops CandidatePortal/apply/{companyId}
 * (JobPostID = the job id on the form; companyId default 183).
 * Job openings load from HRPops CandidatePortal (same id space as Apply).
 */
(function () {
  "use strict";

  var API = "https://career.dojoman.com/api/";
  var CITY_API = API + "StateAndCity/GetCity/";
  var SKILL_API = API + "CarrerPosts/GetCareerSkillset?id=";
  var RATING_API = API + "CarrerPosts/GetRating";
  /* HRPops Dropdown country id for India. */
  var HRPOPS_COUNTRY_ID = "101";
  var DEFAULT_COMPANY_ID = "183";
  var locationSource = "hrpops";

  var STATES = [
    { stateId: 1, stateName: "Tamil Nadu" },
    { stateId: 2, stateName: "Arunachal Pradesh" },
    { stateId: 3, stateName: "Assam" },
    { stateId: 4, stateName: "Bihar" },
    { stateId: 10002, stateName: "Chandigarh (UT)" },
    { stateId: 10003, stateName: "Chhattisgarh" },
    { stateId: 10004, stateName: "Delhi" },
    { stateId: 10005, stateName: "Goa" },
    { stateId: 10006, stateName: "Gujarat" },
    { stateId: 10007, stateName: "Haryana" },
    { stateId: 10008, stateName: "Himachal Pradesh" },
    { stateId: 10009, stateName: "Jammu and Kashmir" },
    { stateId: 10010, stateName: "Jharkhand" },
    { stateId: 10011, stateName: "Karnataka" },
    { stateId: 10012, stateName: "Kerala" },
    { stateId: 10013, stateName: "Madhya Pradesh" },
    { stateId: 10014, stateName: "Maharashtra" },
    { stateId: 10015, stateName: "Manipur" },
    { stateId: 10016, stateName: "Meghalaya" },
    { stateId: 10017, stateName: "Mizoram" },
    { stateId: 10018, stateName: "Nagaland" },
    { stateId: 10019, stateName: "Orissa" },
    { stateId: 10020, stateName: "Puducherry (UT)" },
    { stateId: 10021, stateName: "Punjab" },
    { stateId: 10022, stateName: "Rajasthan" },
    { stateId: 10023, stateName: "Sikkim" },
    { stateId: 10024, stateName: "Andhra Pradesh" },
    { stateId: 10025, stateName: "Telangana" },
    { stateId: 10026, stateName: "Tripura" },
    { stateId: 10027, stateName: "Uttar Pradesh" },
    { stateId: 10028, stateName: "Uttarakhand" },
    { stateId: 10029, stateName: "West Bengal" }
  ];

  var RATINGS = [
    { ratingId: 1, rating: "No Knowledge" },
    { ratingId: 2, rating: "Average" },
    { ratingId: 3, rating: "Good" },
    { ratingId: 4, rating: "Excellent" }
  ];

  var LANG_OPTIONS = [
    "Tamil", "Hindi", "Bengali", "Marathi", "Telugu", "Kannada", "Malayalam",
    "Gujarati", "Konkani", "Punjabi", "Kashmiri", "Dogri", "Sanskrit", "Odia",
    "Assamese", "Maithili", "Manipuri", "Bodo", "Santali", "Urdu", "Sindhi",
    "Nepali", "English", "French", "German", "Spanish", "Japanese", "Mandarin",
    "Korean", "Arabic", "Persian", "Portuguese"
  ];

  var LANG_LEVELS = ["Basic", "Intermediate", "Advanced", "No"];

  var BOARD_TYPES = ["State Board", "CBSE", "ICSE", "Others"];
  var UG_DEGREES = ["B.A.","B.F.A.","B.S.W.","B.Lib.I.Sc.","B.P.E.","B.V.A.","B.Mus.","B.P.A.","B.Sc.","B.Tech.","B.E.","B.C.A.","B.S.","B.Stat.","B.Math.","B.F.Sc.","B.Com.","B.B.A.","B.M.S.","B.B.M.","B.H.M.","B.H.M.C.T.","M.B.B.S.","B.D.S.","B.A.M.S.","B.H.M.S.","B.U.M.S.","B.S.M.S.","B.V.Sc. & A.H.","B.Pharm.","B.P.T.","B.O.T.","B.Sc. Nursing","B.Optom.","B.Arch.","B.Des.","B.Plan.","LL.B.","B.I.D.","B.Ed.","B.El.Ed.","B.Voc."];
  var PG_DEGREES = ["M.A.","M.F.A.","M.S.W.","M.Lib.I.Sc.","M.P.E.","M.V.A.","M.Mus.","M.P.A.","M.Phil.","M.Sc.","M.Tech.","M.E.","M.C.A.","M.Stat.","M.Math.","M.F.Sc.","M.Com.","M.B.A.","M.M.S.","M.H.M.","M.T.T.M.","M.D.","M.S.","M.D.S.","M.Pharm.","M.P.T.","M.O.T.","M.Sc. Nursing","M.P.H.","M.V.Sc.","LL.M.","M.Des.","M.Arch.","M.Plan.","M.Ed.","M.Voc."];
  var PHD_DEGREES = ["Ph.D.","Pharm.D.","Ed.D.","D.B.A.","D.N.B.","LL.D.","Post-Doctoral (Higher Doctoral) Degrees","D.Sc.","D.Litt."];
  var YT_RE = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

  var langUid = 1;
  var knownSkills = [];
  var introAudioFile = null;
  var editedPhotoFile = null;
  var mediaRecorder = null;
  var recordingTimer = null;
  var photoDataUrl = "";
  var photoFileName = "profile.png";
  var photoCropper = null;
  var faceApiReady = false;
  var FACE_MODEL_URI =
    "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";
  var PHOTO_NAME_RE =
    /^([a-zA-Z].*|[1-9].*)\.(((j|J)(p|P)(g|G))|((g|G)(i|I)(f|F))|((b|B)(m|M)(p|P))|((j|J)(p|P)(e|E)(g|G))|((p|P)(n|N)(g|G)))$/;

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /** Prefer ?query; fall back to hash if a clean-URL redirect stripped search. */
  function pageParams() {
    var search = window.location.search || "";
    if (search && search !== "?") {
      return new URLSearchParams(search);
    }
    var hash = (window.location.hash || "").replace(/^#/, "");
    if (hash && (hash.indexOf("=") >= 0 || hash.charAt(0) === "?")) {
      return new URLSearchParams(hash.replace(/^\?/, ""));
    }
    return new URLSearchParams();
  }

  function getId() {
    return (pageParams().get("id") || "").trim();
  }

  function getCompanyId() {
    return (pageParams().get("companyId") || "").trim();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function optionList(items, valueKey, labelKey, placeholder) {
    var html = placeholder
      ? '<option value="">' + escapeHtml(placeholder) + "</option>"
      : "";
    items.forEach(function (item) {
      var v = typeof item === "object" ? item[valueKey] : item;
      var lab = typeof item === "object" ? item[labelKey] : item;
      html +=
        '<option value="' +
        escapeHtml(String(v)) +
        '">' +
        escapeHtml(String(lab).trim()) +
        "</option>";
    });
    return html;
  }

  function fillSelect(el, html) {
    if (el) el.innerHTML = html;
  }

  function yearOptions(from, to, placeholder) {
    var html = placeholder
      ? '<option value="">' + escapeHtml(placeholder) + "</option>"
      : "";
    var y;
    for (y = to; y >= from; y--) {
      html += '<option value="' + y + '">' + y + "</option>";
    }
    return html;
  }

  function setStatus(msg, type) {
    var box = qs("#pr-status");
    if (!box) return;
    box.hidden = !msg;
    box.textContent = msg || "";
    box.className = "pr-status" + (type ? " pr-status--" + type : "");
    if (msg) {
      try {
        box.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (e) {
        /* ignore */
      }
    }
  }

  function fieldValue(form, name) {
    var el = form.elements.namedItem(name);
    if (!el) return "";
    if (el.length && el[0] && el[0].type === "radio") {
      var checked = form.querySelector('input[name="' + name + '"]:checked');
      return checked ? checked.value : "";
    }
    if (el.type === "checkbox") return el.checked ? "true" : "";
    if (el.type === "radio") {
      var c = form.querySelector('input[name="' + name + '"]:checked');
      return c ? c.value : "";
    }
    return (el.value || "").trim();
  }

  function focusField(form, nameOrEl) {
    var el =
      typeof nameOrEl === "string"
        ? form.elements.namedItem(nameOrEl) || document.getElementById(nameOrEl)
        : nameOrEl;
    if (el && el.length && el[0] && !el.focus) el = el[0];
    if (!el) return;
    var panel = el.closest ? el.closest("[data-pr-panel]") : null;
    if (panel && panel.hidden) {
      var name = panel.getAttribute("data-pr-panel");
      qsa("[data-pr-panel]", form).forEach(function (item) {
        item.hidden = item.getAttribute("data-pr-panel") !== name;
      });
      qsa("[data-pr-tab]", form).forEach(function (tab) {
        var on = tab.getAttribute("data-pr-tab") === name;
        tab.classList.toggle("active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
    var eduForm = el.closest ? el.closest("[data-edu-form]") : null;
    if (eduForm && eduForm.hidden) {
      var stepName = eduForm.getAttribute("data-edu-form");
      qsa("[data-edu-form]", form).forEach(function (block) {
        block.hidden = block.getAttribute("data-edu-form") !== stepName;
      });
      qsa("[data-edu-step]", form).forEach(function (step) {
        step.classList.toggle(
          "active",
          step.getAttribute("data-edu-step") === stepName
        );
      });
    }
    if (el && el.focus) {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (e) {
        /* ignore */
      }
      el.focus();
    }
  }

  function fail(form, msg, nameOrEl) {
    setStatus(msg, "error");
    if (nameOrEl) focusField(form, nameOrEl);
    return false;
  }

  function resolveFieldEl(form, nameOrEl) {
    if (!nameOrEl) return null;
    if (typeof nameOrEl !== "string") return nameOrEl;
    var el =
      form.elements.namedItem(nameOrEl) || document.getElementById(nameOrEl);
    if (el && el.length && el[0] && !el.focus) el = el[0];
    return el || null;
  }

  function clearFieldErrors(form) {
    if (!form) return;
    qsa(".is-invalid", form).forEach(function (el) {
      el.classList.remove("is-invalid");
    });
    qsa(".pr-field--invalid", form).forEach(function (el) {
      el.classList.remove("pr-field--invalid");
    });
  }

  function markFieldError(form, nameOrEl) {
    var el = resolveFieldEl(form, nameOrEl);
    if (!el) return null;
    var field = el.closest ? el.closest(".pr-field") : null;
    if (!field && el.id === "isDeclared") {
      field = el.closest ? el.closest(".pr-declare") : null;
    }
    if (field) field.classList.add("pr-field--invalid");

    if (el.type === "radio" || (el.name && form.querySelector('input[type="radio"][name="' + el.name + '"]'))) {
      var radios =
        (el.closest && el.closest(".pr-radios")) ||
        (typeof nameOrEl === "string"
          ? document.getElementById(nameOrEl)
          : null) ||
        (el.name === "ReadyToRelocate" ? document.getElementById("relocateYes") : null);
      if (radios && radios.classList) radios.classList.add("is-invalid");
      if (!field && radios && radios.closest) {
        var radioField = radios.closest(".pr-field");
        if (radioField) radioField.classList.add("pr-field--invalid");
      }
    }

    if (
      el.tagName === "INPUT" ||
      el.tagName === "SELECT" ||
      el.tagName === "TEXTAREA"
    ) {
      el.classList.add("is-invalid");
    } else if (el.classList) {
      el.classList.add("is-invalid");
    }
    var eduForm = el.closest ? el.closest("[data-edu-form]") : null;
    if (eduForm) {
      var stepName = eduForm.getAttribute("data-edu-form");
      var stepBtn = qs('[data-edu-step="' + stepName + '"]', form);
      if (stepBtn) stepBtn.classList.add("is-invalid");
    }
    return el;
  }

  function emailOk(v) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
  }

  function digitsOnly(v) {
    return String(v || "").replace(/\D/g, "").slice(0, 10);
  }

  function pincodeDigits(v) {
    return String(v || "").replace(/\D/g, "").slice(0, 6);
  }

  function skillNamesFromText(text) {
    var seen = {};
    var list = [];
    String(text || "")
      .split(/[,;\n]/)
      .forEach(function (part) {
        var name = part.trim().replace(/\s+/g, " ");
        if (!name) return;
        var key = name.toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        list.push(name);
      });
    return list;
  }

  function attemptOptsHtml() {
    var html = '<option value="No Attempt">No Attempt</option>';
    var n;
    for (n = 1; n <= 10; n++) {
      html += '<option value="' + n + '">' + n + "</option>";
    }
    return html;
  }

  function arrearOptsHtml() {
    var html = '<option value="No Arrear">No Arrear</option>';
    var n;
    for (n = 1; n <= 10; n++) {
      html += '<option value="' + n + '">' + n + "</option>";
    }
    return html;
  }

  function attemptsToApiValue(t) {
    return t === "No Attempt" ? "0" : t || "";
  }

  function arrearsToApiValue(t) {
    return t === "No Arrear" ? "0" : t || "";
  }

  function isYouTube(v) {
    return YT_RE.test(String(v || "").trim());
  }

  function degreeOpts(list) {
    var html = '<option value="">Select Degree</option>';
    list.forEach(function (d) {
      html += '<option value="' + escapeHtml(d) + '">' + escapeHtml(d) + "</option>";
    });
    return html;
  }

  function boardSelect(id) {
    var html =
      '<select id="' +
      id +
      '" name="' +
      id +
      '"><option value="">Select Board</option>';
    BOARD_TYPES.forEach(function (b) {
      html += '<option value="' + escapeHtml(b) + '">' + escapeHtml(b) + "</option>";
    });
    return html + "</select>";
  }

  function typeSelect(id, kind) {
    var opts =
      kind === "diploma"
        ? '<option value="Regular">Regular</option><option value="Part Time">Part Time</option>'
        : kind === "phd"
          ? '<option value="Full Time">Full Time</option><option value="Part Time">Part Time</option>'
          : '<option value="Full Time">Full Time</option><option value="Part Time">Part Time</option><option value="Distance">Distance</option>';
    return (
      '<select id="' +
      id +
      '" name="' +
      id +
      '"><option value="">Select</option>' +
      opts +
      "</select>"
    );
  }

  function collectCertifications(form) {
    var rows = qsa("[data-cert-row]", form);
    var list = [];
    var partial = false;
    rows.forEach(function (row) {
      var category = (qs("[data-cert='category']", row).value || "").trim();
      var name = (qs("[data-cert='name']", row).value || "").trim();
      var institute = (qs("[data-cert='institute']", row).value || "").trim();
      var duration = (qs("[data-cert='duration']", row).value || "").trim();
      if (!category && !name && !institute && !duration) return;
      if (!category || !name || !institute || !duration) partial = true;
      list.push({
        category: category,
        name: name,
        institute: institute,
        duration: duration
      });
    });
    return { list: list, partial: partial };
  }

  function joinAddress(line1, line2) {
    var a = (line1 || "").trim();
    var b = (line2 || "").trim();
    return b ? a + "-" + b : a;
  }

  function hrpopsApiBase() {
    var hrpops = window.NH_HRPOPS_CAREERS;
    var base = "https://api.hrpops.com/api";
    if (hrpops && typeof hrpops.config === "function") {
      var cfg = hrpops.config();
      if (cfg && cfg.apiBase) base = String(cfg.apiBase).replace(/\/$/, "");
    }
    return base;
  }

  function hrpopsApplyUrl(companyId) {
    return (
      hrpopsApiBase() +
      "/CandidatePortal/apply/" +
      encodeURIComponent(companyId)
    );
  }

  var EXCLUDED_STATE_NAMES = {
    kenmore: true,
    narora: true,
    natwar: true,
    "paschim medinipur": true,
    vaishali: true
  };

  var MAJOR_CITIES = [
    /* Tamil Nadu */
    "Chennai", "Coimbatore", "Madurai", "Thiruchirapalli", "Tiruchirappalli",
    "Salem", "Tirunelveli", "Tirupur", "Tiruppur", "Erode", "Vellore",
    "Tuticorin", "Thoothukudi", "Nagercoil", "Thanjavur", "Dindigul",
    "Hosur", "Kanchipuram", "Kancheepuram", "Kumbakonam", "Karur",
    "Ooty", "Udhagamandalam", "Kodaikanal", "Karaikkudi", "Karaikudi",
    "Pollachi", "Rajapalayam", "Sivakasi", "Ambur", "Neyveli",
    /* Karnataka */
    "Bengaluru", "Bangalore", "Mysuru", "Mysore", "Mangaluru", "Mangalore",
    "Hubballi", "Hubli", "Belagavi", "Belgaum", "Davanagere", "Ballari",
    "Bellary", "Shivamogga", "Shimoga", "Tumakuru", "Tumkur", "Udupi",
    "Manipal", "Hospet", "Bidar", "Raichur", "Hassan",
    /* Kerala */
    "Thiruvananthapuram", "Trivandrum", "Kochi", "Cochin", "Ernakulam",
    "Kozhikode", "Calicut", "Thrissur", "Kollam", "Quilon", "Palakkad",
    "Alappuzha", "Alleppey", "Kannur", "Kottayam", "Thalassery",
    /* Andhra Pradesh */
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool",
    "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Cuddapah",
    "Anantapur", "Eluru", "Ongole", "Vizianagaram", "Machilipatnam",
    /* Telangana */
    "Hyderabad", "Secunderabad", "Warangal", "Nizamabad", "Khammam",
    "Karimnagar", "Ramagundam", "Mahbubnagar", "Nalgonda",
    /* Maharashtra */
    "Mumbai", "Navi Mumbai", "Thane", "Pune", "Nagpur", "Nashik",
    "Aurangabad", "Solapur", "Kolhapur", "Amravati", "Nanded", "Sangli",
    "Jalgaon", "Akola", "Latur", "Ahmednagar", "Satara", "Ratnagiri",
    "Panvel", "Kalyan", "Vasai", "Virar", "Chandrapur", "Dhule",
    /* Delhi & NCR / Haryana / Punjab / Chandigarh */
    "Delhi", "New Delhi", "Gurugram", "Gurgaon", "Faridabad", "Panipat",
    "Ambala", "Karnal", "Rohtak", "Hisar", "Sonipat", "Panchkula",
    "Kurukshetra", "Rewari", "Yamunanagar", "Ludhiana", "Amritsar",
    "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot",
    "Hoshiarpur", "Moga", "Phagwara", "Kapurthala", "Chandigarh",
    /* Gujarat */
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar",
    "Jamnagar", "Junagadh", "Anand", "Navsari", "Bharuch", "Vapi",
    "Gandhidham", "Morbi", "Bhuj", "Porbandar", "Mehsana", "Nadiad",
    /* Rajasthan */
    "Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer",
    "Bhilwara", "Alwar", "Bharatpur", "Sikar", "Pali", "Sri Ganganagar",
    "Ganganagar", "Chittorgarh", "Jaisalmer",
    /* Uttar Pradesh */
    "Lucknow", "Noida", "Greater Noida", "Ghaziabad", "Kanpur", "Agra",
    "Varanasi", "Meerut", "Prayagraj", "Allahabad", "Bareilly", "Aligarh",
    "Moradabad", "Saharanpur", "Gorakhpur", "Jhansi", "Mathura",
    "Ayodhya", "Faizabad", "Firozabad", "Muzaffarnagar", "Shahjahanpur",
    /* West Bengal */
    "Kolkata", "Calcutta", "Howrah", "Durgapur", "Asansol", "Siliguri",
    "Kharagpur", "Haldia", "Darjeeling", "Bardhaman", "Burdwan", "Malda",
    "Baharampur", "Kalyani",
    /* Madhya Pradesh & Chhattisgarh */
    "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas",
    "Satna", "Ratlam", "Rewa", "Katni", "Singrauli", "Khandwa", "Chhindwara",
    "Raipur", "Bhilai", "Durg", "Bilaspur", "Korba", "Rajnandgaon",
    "Jagdalpur", "Raigarh", "Ambikapur",
    /* Bihar, Jharkhand, Odisha */
    "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga",
    "Bihar Sharif", "Arrah", "Begusarai", "Katihar", "Munger", "Chapra",
    "Hajipur", "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro",
    "Bokaro Steel City", "Deoghar", "Hazaribagh", "Giridih", "Ramgarh",
    "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Brahmapur",
    "Sambalpur", "Puri", "Balasore", "Baleshwar", "Bhadrak", "Baripada",
    "Jharsuguda",
    /* Uttarakhand, Himachal Pradesh, J&K */
    "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh", "Rudrapur",
    "Kashipur", "Nainital", "Mussoorie", "Shimla", "Dharamshala", "Solan",
    "Mandi", "Kullu", "Manali", "Baddi", "Palampur", "Hamirpur", "Una",
    "Chamba", "Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur",
    "Kathua", "Sopore", "Leh",
    /* Goa, Puducherry, North-East & UTs */
    "Panaji", "Margao", "Madgaon", "Vasco Da Gama", "Vasco-da-Gama",
    "Mapusa", "Ponda", "Pondicherry", "Puducherry", "Karaikal", "Mahe",
    "Yanam", "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon",
    "Tinsukia", "Tezpur", "Bongaigaon", "Imphal", "Shillong", "Tura",
    "Aizawl", "Kohima", "Dimapur", "Agartala", "Gangtok", "Itanagar",
    "Naharlagun", "Port Blair", "Silvassa", "Daman", "Diu", "Kavaratti"
  ];

  var MAJOR_CITY_LOOKUP = (function () {
    var map = {};
    MAJOR_CITIES.forEach(function (name) {
      map[name.toLowerCase()] = true;
    });
    return map;
  })();

  function filterMajorCityRows(rows, getName) {
    if (!Array.isArray(rows) || !rows.length) return [];
    var matched = rows.filter(function (row) {
      var n = String(getName(row) || "").trim().toLowerCase();
      return !!MAJOR_CITY_LOOKUP[n];
    });
    return matched.length ? matched : rows;
  }

  function dropdownRows(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    var rows = payload.data || payload.Data;
    return Array.isArray(rows) ? rows : [];
  }

  async function fillHrpopsStates(form) {
    var names = ["StateID", "CurrentStateID", "PermanentStateID"];
    var selects = names.map(function (name) {
      return form.elements.namedItem(name);
    });
    try {
      var res = await fetch(
        hrpopsApiBase() + "/Dropdown/GetState/list/" + HRPOPS_COUNTRY_ID
      );
      var rows = dropdownRows(await res.json());
      var opts = '<option value="">Select State</option>';
      rows.forEach(function (row) {
        var id = row.Id != null ? row.Id : row.id;
        var name = String(row.Name || row.name || "").trim();
        if (id == null || !name) return;
        if (EXCLUDED_STATE_NAMES[name.toLowerCase()]) return;
        opts +=
          '<option value="' +
          escapeHtml(String(id)) +
          '">' +
          escapeHtml(name) +
          "</option>";
      });
      selects.forEach(function (el) {
        fillSelect(el, opts);
      });
    } catch (err) {
      console.warn("State load failed", err);
      selects.forEach(function (el) {
        fillSelect(el, '<option value="">Could not load states</option>');
      });
    }
  }

  async function loadCities(stateId, targetSelect) {
    fillSelect(targetSelect, '<option value="">Select City</option>');
    if (!stateId) return;
    try {
      var opts = '<option value="">Select City</option>';
      if (locationSource === "hrpops") {
        var res = await fetch(
          hrpopsApiBase() + "/Dropdown/GetCity/list/" + encodeURIComponent(stateId)
        );
        var hrRows = filterMajorCityRows(
          dropdownRows(await res.json()),
          function (c) {
            return c.Name || c.name || "";
          }
        );
        hrRows.forEach(function (c) {
          var id = c.Id != null ? c.Id : c.id;
          var name = c.Name || c.name || "";
          if (id == null) return;
          opts +=
            '<option value="' +
            escapeHtml(String(id)) +
            '">' +
            escapeHtml(String(name).trim()) +
            "</option>";
        });
      } else {
        var legacy = await fetch(CITY_API + stateId);
        var data = await legacy.json();
        if (!Array.isArray(data)) return;
        var legacyRows = filterMajorCityRows(data, function (c) {
          return c.cityName || "";
        });
        legacyRows.forEach(function (c) {
          opts +=
            '<option value="' +
            escapeHtml(String(c.cityId)) +
            '">' +
            escapeHtml(String(c.cityName || "").trim()) +
            "</option>";
        });
      }
      fillSelect(targetSelect, opts);
    } catch (err) {
      console.warn("City load failed", err);
    }
  }

  async function loadRatings() {
    try {
      var res = await fetch(RATING_API);
      var data = await res.json();
      if (Array.isArray(data) && data.length) {
        RATINGS.length = 0;
        data.forEach(function (r) {
          RATINGS.push({ ratingId: r.ratingId, rating: r.rating });
        });
      }
    } catch (err) {
      console.warn("Rating load failed, using defaults", err);
    }
  }

  async function loadSkills(jobId, container, isIntern, preset) {
    if (!container) return [];
    container.innerHTML = "";
    try {
      var data = null;
      if (Array.isArray(preset) && preset.length) {
        data = preset
          .map(function (sk) {
            return {
              skillId: sk.skillId || sk.SkillId,
              skill: sk.skill || sk.Skill || sk.skillName || ""
            };
          })
          .filter(function (sk) {
            return sk.skillId;
          });
      } else if (locationSource === "hrpops") {
        data = [];
      } else {
        var res = await fetch(SKILL_API + jobId);
        data = await res.json();
      }
      if (!Array.isArray(data) || !data.length) {
        container.innerHTML =
          '<p class="pr-hint">No preset skills for this role. Type a skill in the box above and click Add.</p>';
        ensureKnownSkillsUi();
        return [];
      }
      var years = [];
      var m;
      for (m = 0; m <= 15; m++) years.push({ value: m, names: String(m) });
      var months = [];
      for (m = 0; m <= 11; m++) months.push({ value: m, names: String(m) });

      var html = '<div class="pr-skills-list">';
      data.forEach(function (sk) {
        var id = sk.skillId;
        var skillLabel = String(sk.skill || "").trim();
        html +=
          '<div class="pr-skill-row" data-skill-id="' +
          escapeHtml(String(id)) +
          '" data-skill-name="' +
          escapeHtml(skillLabel) +
          '">' +
          '<div class="pr-skill-name">' +
          escapeHtml(skillLabel) +
          "</div>" +
          '<div class="pr-field">' +
          "<label>Ratings <span class=\"pr-req\">*</span></label>" +
          '<select class="pr-skill-rate" id="rate_' +
          id +
          '" data-skill="' +
          id +
          '">' +
          optionList(RATINGS, "ratingId", "rating", "Choose rating") +
          "</select></div>";
        if (!isIntern) {
          html +=
            '<div class="pr-field">' +
            "<label>Years <span class=\"pr-req\">*</span></label>" +
            '<select class="pr-skill-year" id="year_' +
            id +
            '" data-skill="' +
            id +
            '">' +
            optionList(years, "value", "names", "Choose Year") +
            "</select></div>" +
            '<div class="pr-field">' +
            "<label>Months <span class=\"pr-req\">*</span></label>" +
            '<select class="pr-skill-month" id="month_' +
            id +
            '" data-skill="' +
            id +
            '">' +
            optionList(months, "value", "names", "Choose Month") +
            "</select></div>";
        }
        html += "</div>";
      });
      html += "</div>";
      container.innerHTML = html;

      if (!isIntern) {
        qsa(".pr-skill-rate", container).forEach(function (sel) {
          sel.addEventListener("change", function () {
            var sid = sel.getAttribute("data-skill");
            var yr = container.querySelector(
              '.pr-skill-year[data-skill="' + sid + '"]'
            );
            var mo = container.querySelector(
              '.pr-skill-month[data-skill="' + sid + '"]'
            );
            if (sel.value === "1") {
              if (yr) {
                yr.value = "0";
                yr.disabled = true;
              }
              if (mo) {
                mo.value = "0";
                mo.disabled = true;
              }
            } else {
              if (yr) yr.disabled = false;
              if (mo) mo.disabled = false;
            }
          });
        });
      }

      return data;
    } catch (err) {
      console.warn("Skills load failed", err);
      container.innerHTML =
        '<p class="pr-hint">Could not load preset skills. Type a skill in the box above and click Add.</p>';
      ensureKnownSkillsUi();
      return [];
    }
  }

  function collectSkills(container, isIntern) {
    var rows = qsa(".pr-skill-row", container);
    var list = [];
    var missing = false;
    rows.forEach(function (row) {
      var id = parseInt(row.getAttribute("data-skill-id"), 10);
      var skillName =
        (row.getAttribute("data-skill-name") || "").trim() ||
        ((row.querySelector(".pr-skill-name") || {}).textContent || "").trim();
      var rate = row.querySelector(".pr-skill-rate");
      var year = row.querySelector(".pr-skill-year");
      var month = row.querySelector(".pr-skill-month");
      var r = rate ? rate.value : "";
      if (!r) {
        missing = true;
        return;
      }
      if (isIntern) {
        list.push({
          skillid: id,
          skill: skillName,
          rating: parseInt(r, 10),
          year: 0,
          month: 0
        });
        return;
      }
      var y = year ? year.value : "";
      var m = month ? month.value : "";
      if (r !== "1" && (y === "" || m === "")) {
        missing = true;
        return;
      }
      list.push({
        skillid: id,
        skill: skillName,
        rating: parseInt(r, 10),
        year: parseInt(y, 10) || 0,
        month: parseInt(m, 10) || 0
      });
    });
    return { list: list, missing: missing && rows.length > 0 };
  }

  var knownLanguages = [];

  function langIsMother(lang) {
    return !!(
      lang &&
      (lang.motherTongue === "Yes" || lang.isMotherTongue === true)
    );
  }

  /** Keep at most one mother tongue in knownLanguages (and clear isMotherTongue). */
  function setExclusiveMotherTongue(uid, enabled) {
    var want = enabled !== false;
    var target = uid == null ? null : String(uid);
    knownLanguages.forEach(function (lang) {
      var isTarget = target != null && String(lang.uid) === target;
      var on = want && isTarget;
      lang.motherTongue = on ? "Yes" : "No";
      lang.isMotherTongue = on;
    });
  }

  var syncingMotherChecks = false;

  function paintMotherChecks(container) {
    if (!container) return;
    syncingMotherChecks = true;
    try {
      qsa(".pr-lang-mother-check", container).forEach(function (box) {
        var item = box.closest(".pr-lang-item");
        if (!item) return;
        var uid = item.getAttribute("data-lang-uid");
        var lang = null;
        knownLanguages.forEach(function (row) {
          if (String(row.uid) === String(uid)) lang = row;
        });
        var on = langIsMother(lang);
        if (box.checked !== on) box.checked = on;
      });
    } finally {
      syncingMotherChecks = false;
    }
  }

  /** If multiple rows are flagged, keep the first; clear the rest. */
  function enforceOneMotherTongue(list) {
    var rows = Array.isArray(list) ? list : [];
    var kept = false;
    return rows.map(function (row) {
      var yes = !kept && langIsMother(row);
      if (yes) kept = true;
      return {
        name: row.name || row.language || "",
        language: row.language || row.name || "",
        read: row.read || "",
        write: row.write || "",
        speak: row.speak || "",
        motherTongue: yes ? "Yes" : "No",
        isMotherTongue: yes
      };
    });
  }

  function languagesSheetHtml() {
    var langOpts = optionList(LANG_OPTIONS, null, null, "Select Language...");
    var levelOpts = optionList(LANG_LEVELS, null, null, "Select");
    return (
      '<div class="pr-lang-title" id="pr-lang-title">Languages Known <span class="pr-req">*</span></div>' +
      '<div class="pr-lang-scroll">' +
      '<div class="pr-lang-head" aria-hidden="true">' +
      "<span>Language</span><span>Read</span><span>Write</span><span>Speak</span>" +
      "</div>" +
      '<div class="pr-lang-entry">' +
      '<select id="langNameEntry" class="pr-lang-name is-placeholder" aria-label="Language">' +
      langOpts +
      "</select>" +
      '<select id="langReadEntry" class="pr-lang-read is-placeholder" aria-label="Read">' +
      levelOpts +
      "</select>" +
      '<select id="langWriteEntry" class="pr-lang-write is-placeholder" aria-label="Write">' +
      levelOpts +
      "</select>" +
      '<select id="langSpeakEntry" class="pr-lang-speak is-placeholder" aria-label="Speak">' +
      levelOpts +
      "</select>" +
      '<button type="button" class="pr-lang-add" id="pr-lang-add">Add</button>' +
      "</div>" +
      '<div class="pr-lang-list" id="pr-lang-list"></div>' +
      "</div>" +
      '<p class="pr-lang-msg" hidden></p>'
    );
  }

  function langTrashIcon() {
    return (
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
      '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13h8l1-13"/>' +
      "</svg>"
    );
  }

  function setLangMsg(container, text) {
    var el = qs(".pr-lang-msg", container);
    if (!el) return;
    el.textContent = text || "";
    el.hidden = !text;
  }

  function markLangPlaceholder(sel) {
    if (!sel) return;
    var empty = !sel.value;
    sel.classList.toggle("is-placeholder", empty);
    if (!empty) sel.classList.remove("is-invalid");
  }

  function renderKnownLanguages(container) {
    var list = qs("#pr-lang-list", container);
    if (!list) return;
    list.innerHTML = knownLanguages
      .map(function (lang) {
        return (
          '<div class="pr-lang-item" data-lang-uid="' +
          lang.uid +
          '" data-name="' +
          escapeHtml(lang.name) +
          '" data-read="' +
          escapeHtml(lang.read) +
          '" data-write="' +
          escapeHtml(lang.write) +
          '" data-speak="' +
          escapeHtml(lang.speak) +
          '">' +
          '<div class="pr-lang-val">' +
          escapeHtml(lang.name) +
          "</div>" +
          '<div class="pr-lang-val">' +
          escapeHtml(lang.read) +
          "</div>" +
          '<div class="pr-lang-val">' +
          escapeHtml(lang.write) +
          "</div>" +
          '<div class="pr-lang-val">' +
          escapeHtml(lang.speak) +
          "</div>" +
          '<label class="pr-lang-mother">' +
          '<input type="checkbox" class="pr-lang-mother-check"' +
          (langIsMother(lang) ? " checked" : "") +
          " />" +
          '<span class="pr-lang-mother-tag">{Mother Tongue}</span></label>' +
          '<button type="button" class="pr-lang-remove" data-lang="' +
          lang.uid +
          '" aria-label="Remove ' +
          escapeHtml(lang.name) +
          '">' +
          langTrashIcon() +
          "</button></div>"
        );
      })
      .join("");
  }

  function resetLanguageEntry(container) {
    ["#langNameEntry", "#langReadEntry", "#langWriteEntry", "#langSpeakEntry"].forEach(
      function (sel) {
        var el = qs(sel, container);
        if (!el) return;
        el.value = "";
        el.classList.remove("is-invalid");
        markLangPlaceholder(el);
      }
    );
  }

  function addKnownLanguage(container) {
    var nameEl = qs("#langNameEntry", container);
    var readEl = qs("#langReadEntry", container);
    var writeEl = qs("#langWriteEntry", container);
    var speakEl = qs("#langSpeakEntry", container);
    var name = nameEl ? nameEl.value : "";
    var read = readEl ? readEl.value : "";
    var write = writeEl ? writeEl.value : "";
    var speak = speakEl ? speakEl.value : "";
    [nameEl, readEl, writeEl, speakEl].forEach(function (el) {
      if (!el) return;
      el.classList.toggle("is-invalid", !el.value);
    });
    if (!name || !read || !write || !speak) {
      setLangMsg(container, "Select language, read, write, and speak, then click Add.");
      return;
    }
    if (
      knownLanguages.some(function (lang) {
        return lang.name.toLowerCase() === name.toLowerCase();
      })
    ) {
      setLangMsg(container, "That language is already added.");
      return;
    }
    var hasMother = knownLanguages.some(langIsMother);
    langUid += 1;
    var added = {
      uid: langUid,
      name: name,
      read: read,
      write: write,
      speak: speak,
      motherTongue: hasMother ? "No" : "Yes",
      isMotherTongue: !hasMother
    };
    knownLanguages.push(added);
    if (langIsMother(added)) {
      setExclusiveMotherTongue(added.uid, true);
    } else {
      var keeper = null;
      knownLanguages.forEach(function (lang) {
        if (keeper == null && langIsMother(lang)) keeper = lang.uid;
      });
      if (keeper != null) setExclusiveMotherTongue(keeper, true);
    }
    resetLanguageEntry(container);
    setLangMsg(container, "");
    renderKnownLanguages(container);
  }

  function wireLanguageSection(container) {
    if (!container || container.getAttribute("data-pr-wired") === "1") return;
    container.setAttribute("data-pr-wired", "1");
    qsa(".pr-lang-entry select", container).forEach(function (sel) {
      markLangPlaceholder(sel);
      sel.addEventListener("change", function () {
        markLangPlaceholder(sel);
        setLangMsg(container, "");
      });
    });
    var entry = qs(".pr-lang-entry", container);
    if (entry) {
      entry.addEventListener("keydown", function (ev) {
        if (ev.key !== "Enter") return;
        ev.preventDefault();
        addKnownLanguage(container);
      });
    }
    container.addEventListener("click", function (ev) {
      if (ev.target.closest(".pr-lang-add")) {
        addKnownLanguage(container);
        return;
      }
      var remBtn = ev.target.closest(".pr-lang-remove");
      if (!remBtn) return;
      var uid = remBtn.getAttribute("data-lang");
      knownLanguages = knownLanguages.filter(function (lang) {
        return String(lang.uid) !== String(uid);
      });
      renderKnownLanguages(container);
      setLangMsg(container, "");
    });
    container.addEventListener("change", function (ev) {
      if (syncingMotherChecks) return;
      var box =
        ev.target && ev.target.closest
          ? ev.target.closest(".pr-lang-mother-check")
          : null;
      if (!box) return;
      var item = box.closest(".pr-lang-item");
      if (!item) return;
      var uid = item.getAttribute("data-lang-uid");
      if (box.checked) {
        setExclusiveMotherTongue(uid, true);
      } else {
        knownLanguages.forEach(function (lang) {
          if (String(lang.uid) === String(uid)) {
            lang.motherTongue = "No";
            lang.isMotherTongue = false;
          }
        });
      }
      paintMotherChecks(container);
    });
  }

  function collectLanguages(container) {
    var rows = qsa(".pr-lang-item", container);
    var list = [];
    rows.forEach(function (row) {
      var name = row.getAttribute("data-name") || "";
      var read = row.getAttribute("data-read") || "";
      var write = row.getAttribute("data-write") || "";
      var speak = row.getAttribute("data-speak") || "";
      var motherEl = row.querySelector(".pr-lang-mother-check");
      if (name && read && write && speak) {
        list.push({
          name: name,
          read: read,
          write: write,
          speak: speak,
          motherTongue: motherEl && motherEl.checked ? "Yes" : "No",
          isMotherTongue: !!(motherEl && motherEl.checked)
        });
      }
    });
    return enforceOneMotherTongue(list);
  }

  var EDU_REQUIRED_FIELDS = {
    "10th": ["sslcInstitute", "sslcBoard", "sslcYear", "sslcPercentage"],
    "12th": ["hscInstitute", "hscBoard", "hscYear", "hscPercentage"],
    diploma: [
      "diploma1Degree",
      "diploma1Spec",
      "diploma1Type",
      "diploma1YearStart",
      "diploma1YearEnd",
      "diploma1Percentage"
    ],
    ug: [
      "ugDegree",
      "ugSpec",
      "ugType",
      "ugYearStart",
      "ugYearEnd",
      "ugPercentage"
    ],
    pg: [
      "pgDegree",
      "pgSpec",
      "pgType",
      "pgYearStart",
      "pgYearEnd",
      "pgPercentage"
    ],
    phd: [
      "phdDegree",
      "phdSpec",
      "phdType",
      "phdYearStart",
      "phdYearEnd",
      "phdPercentage"
    ]
  };

  function validateEducation(form, requireField) {
    var checkedSteps = {};

    function hasAnyEduField(step) {
      var keys = EDU_REQUIRED_FIELDS[step] || [];
      return keys.some(function (k) {
        return !!fieldValue(form, k);
      });
    }

    function hasAllEduFields(step) {
      var keys = EDU_REQUIRED_FIELDS[step] || [];
      return (
        keys.length > 0 &&
        keys.every(function (k) {
          return !!fieldValue(form, k);
        })
      );
    }

    function requireEduStep(step) {
      if (checkedSteps[step]) return;
      checkedSteps[step] = true;
      (EDU_REQUIRED_FIELDS[step] || []).forEach(function (name) {
        requireField(!!fieldValue(form, name), name);
      });
    }

    /* 10th Standard is always mandatory */
    requireEduStep("10th");

    var highest = fieldValue(form, "HighestQualification");
    if (highest === "12th Standard") {
      requireEduStep("12th");
    } else if (highest === "Diploma") {
      requireEduStep("diploma");
    } else if (
      highest === "Under Graduate" ||
      highest === "Post Graduate" ||
      highest === "Doctorate"
    ) {
      if (!hasAllEduFields("12th") && !hasAllEduFields("diploma")) {
        var preferDiploma =
          !hasAnyEduField("12th") &&
          (hasAnyEduField("diploma") || activeEduStep(form) === "diploma");
        requireEduStep(preferDiploma ? "diploma" : "12th");
      }
      requireEduStep("ug");
      if (highest === "Post Graduate" || highest === "Doctorate") {
        requireEduStep("pg");
      }
      if (highest === "Doctorate") {
        requireEduStep("phd");
      }
    }

    /* Any other step that was partially filled must be completed */
    ["12th", "diploma", "ug", "pg", "phd"].forEach(function (step) {
      if (hasAnyEduField(step)) {
        requireEduStep(step);
      }
    });
  }

  function validate(form, isIntern, skillPack, langList) {
    clearFieldErrors(form);
    var missing = [];
    var formatIssues = [];

    function requireField(cond, nameOrEl, formatMsg) {
      if (cond) return;
      var target = markFieldError(form, nameOrEl) || nameOrEl;
      if (formatMsg) {
        formatIssues.push({ msg: formatMsg, el: target });
      } else {
        missing.push(target);
      }
    }

    var name = fieldValue(form, "Name");
    requireField(!!name, "Name");
    if (name && name.length < 3) {
      requireField(false, "Name", "Name should contain atleast 3 characters");
    }
    requireField(!!fieldValue(form, "Dob"), "Dob");
    requireField(!!fieldValue(form, "Gender"), "Gender");
    requireField(!!fieldValue(form, "StateID"), "StateID");
    requireField(!!fieldValue(form, "CityID"), "CityID");

    var phone = digitsOnly(fieldValue(form, "Phoneno"));
    requireField(!!phone, "Phoneno");
    if (phone && phone.length !== 10) {
      requireField(false, "Phoneno", "Phone no. must be 10 digits");
    }

    var email = fieldValue(form, "Email");
    requireField(!!email, "Email");
    if (email && !emailOk(email)) {
      requireField(false, "Email", "Invalid email");
    }

    if (!isIntern) {
      requireField(!!fieldValue(form, "Experience"), "Experience");
    }
    var aboutSelf = fieldValue(form, "AboutYourSelf");
    requireField(!!aboutSelf, "AboutYourSelf");
    if (aboutSelf && aboutSelf.length > 6000) {
      requireField(
        false,
        "AboutYourSelf",
        "Explain about yourself must be at most 6000 characters"
      );
    }
    if (
      !isIntern &&
      fieldValue(form, "Experience") !== "1" &&
      !fieldValue(form, "ReasonForQuit")
    ) {
      requireField(false, "ReasonForQuit");
    }

    requireField(!!fieldValue(form, "Address"), "Address");
    requireField(!!fieldValue(form, "CurrentStateID"), "CurrentStateID");
    requireField(!!fieldValue(form, "CurrentCityID"), "CurrentCityID");
    var pin = pincodeDigits(fieldValue(form, "CurrentPincode"));
    requireField(!!pin, "CurrentPincode");
    if (pin && pin.length !== 6) {
      requireField(false, "CurrentPincode", "Pincode must be 6 digits");
    }

    requireField(!!fieldValue(form, "PermanentAddress"), "PermanentAddress");
    requireField(!!fieldValue(form, "PermanentStateID"), "PermanentStateID");
    requireField(!!fieldValue(form, "PermanentCityID"), "PermanentCityID");
    var ppin = pincodeDigits(fieldValue(form, "PermanentPincode"));
    requireField(!!ppin, "PermanentPincode");
    if (ppin && ppin.length !== 6) {
      requireField(false, "PermanentPincode", "Pincode must be 6 digits");
    }

    if (
      !isIntern &&
      fieldValue(form, "Experience") !== "1" &&
      !fieldValue(form, "CurrentSalary")
    ) {
      requireField(false, "CurrentSalary");
    }

    requireField(
      !!fieldValue(form, "HighestQualification"),
      "HighestQualification"
    );

    if (!isIntern) {
      var expSal = fieldValue(form, "ExpectedSalary");
      requireField(!!expSal, "ExpectedSalary");
      if (expSal && expSal.length < 5) {
        requireField(
          false,
          "ExpectedSalary",
          "Enter at-least 5 digits in expected salary"
        );
      }
    } else {
      var stip = fieldValue(form, "ExpectedStipend");
      requireField(!!stip, "ExpectedStipend");
      if (stip && stip.length < 4) {
        requireField(
          false,
          "ExpectedStipend",
          "Enter at-least 4 digits in expected stipend"
        );
      }
    }

    requireField(!!fieldValue(form, "JoinPeriod"), "JoinPeriod");
    requireField(!!fieldValue(form, "ReadyToRelocate"), "ReadyToRelocate");

    var photo = form.elements.namedItem("ProfilePhoto");
    if (!editedPhotoFile && (!photo || !photo.files || !photo.files[0])) {
      requireField(false, "ProfilePhoto");
    }

    var resume = form.elements.namedItem("ResumeFile");
    if (!isIntern && (!resume || !resume.files || !resume.files[0])) {
      requireField(false, "ResumeFile");
    }
    if (resume && resume.files && resume.files[0]) {
      var rName = resume.files[0].name.toLowerCase();
      if (!/\.(pdf|doc|docx)$/.test(rName)) {
        requireField(false, "ResumeFile", "Resume must be PDF, DOC, or DOCX");
      }
    }

    if (skillPack && skillPack.missing) {
      requireField(false, qs("#pr-skills"));
    }

    var typedSkills = knownSkills.filter(function (s) {
      return s && s.name;
    });
    var skillRows = qsa(".pr-skill-row", qs("#pr-skills")).length;
    if (!typedSkills.length || (!skillRows && !typedSkills.length)) {
      requireField(false, "skill-entry");
    }

    var certs = collectCertifications(form);
    if (certs.partial) {
      requireField(false, qs("#cert-rows"));
    }

    var yt = fieldValue(form, "IntroVideoLink");
    if (yt && !isYouTube(yt)) {
      requireField(false, "IntroVideoLink", "Please enter a valid YouTube link.");
    }

    requireField(!!fieldValue(form, "InterviewMode1"), "InterviewMode1");

    if (!langList || !langList.length) {
      requireField(false, qs("#pr-languages"));
    } else {
      var motherCount = langList.filter(function (l) {
        return langIsMother(l) && l.name;
      }).length;
      if (motherCount !== 1) {
        requireField(false, qs("#pr-languages"));
      }
    }

    requireField(
      !!fieldValue(form, "WorkModePreference"),
      "WorkModePreference"
    );
    requireField(!!fieldValue(form, "MaritalStatus"), "MaritalStatus");

    validateEducation(form, requireField);

    var declared = form.elements.namedItem("isDeclared");
    if (!declared || !declared.checked) {
      requireField(false, "isDeclared");
    }

    if (!missing.length && !formatIssues.length) return true;

    var firstEl =
      (missing.length && missing[0]) ||
      (formatIssues.length && formatIssues[0].el) ||
      null;
    var msg;
    if (missing.length && formatIssues.length) {
      msg =
        "Please fill all mandatory fields. " + formatIssues[0].msg;
    } else if (missing.length) {
      msg = "Please fill all mandatory fields";
    } else {
      msg = formatIssues[0].msg;
    }
    setStatus(msg, "error");
    if (firstEl) focusField(form, firstEl);
    return false;
  }

  function buildFormData(form, jobId, isIntern, skillList, languages) {
    var fd = new FormData();
    var personalState = fieldValue(form, "StateID");
    var personalCity = fieldValue(form, "CityID");
    var currentState = fieldValue(form, "CurrentStateID");
    var currentCity = fieldValue(form, "CurrentCityID");
    var pincode = fieldValue(form, "CurrentPincode");
    var address = joinAddress(
      fieldValue(form, "Address"),
      fieldValue(form, "Address2")
    );
    var permanent = joinAddress(
      fieldValue(form, "PermanentAddress"),
      fieldValue(form, "PermanentAddress2")
    );

    // Live internship submit overwrites these fields
    var experience = isIntern ? "0" : fieldValue(form, "Experience");
    var expectedSalary = isIntern ? "0" : fieldValue(form, "ExpectedSalary");
    var expectedStipend = isIntern ? fieldValue(form, "ExpectedStipend") : "";
    var joinPeriod = normalizeJoinPeriod(
      isIntern ? "0" : fieldValue(form, "JoinPeriod")
    );
    var currentSalary = isIntern ? "" : fieldValue(form, "CurrentSalary");
    var reasonQuit = isIntern ? "" : fieldValue(form, "ReasonForQuit");

    fd.append("Name", fieldValue(form, "Name"));
    fd.append("Dob", fieldValue(form, "Dob"));
    fd.append("Gender", fieldValue(form, "Gender"));
    fd.append("CountryID", COUNTRY_ID);
    fd.append("StateID", personalState || currentState);
    fd.append("CityID", personalCity || currentCity);
    fd.append("Phoneno", digitsOnly(fieldValue(form, "Phoneno")));
    fd.append("Email", fieldValue(form, "Email"));
    fd.append("Experience", experience);
    fd.append("ReasonForQuit", reasonQuit);
    fd.append("Address", address);
    fd.append("CurrentStateID", currentState);
    fd.append("CurrentCityID", currentCity);
    fd.append("CurrentPincode", pincode);
    fd.append("PermanentAddress", permanent);
    fd.append("PermanentStateID", fieldValue(form, "PermanentStateID"));
    fd.append("PermanentCityID", fieldValue(form, "PermanentCityID"));
    fd.append("PermanentPincode", fieldValue(form, "PermanentPincode"));
    fd.append("CarrerID", String(jobId));
    fd.append("Pincode", pincode);
    fd.append("AboutYourSelf", fieldValue(form, "AboutYourSelf"));
    fd.append("ExpectedSalary", expectedSalary);
    fd.append("ExpectedStipend", expectedStipend);
    fd.append("CurrentSalary", currentSalary);
    fd.append("ReadyToRelocate", fieldValue(form, "ReadyToRelocate"));
    fd.append("WorkModePreference", fieldValue(form, "WorkModePreference"));
    fd.append("InterviewMode1", fieldValue(form, "InterviewMode1"));
    fd.append("ExpectedDOJ", fieldValue(form, "ExpectedDOJ"));
    fd.append("LanguagesKnown", JSON.stringify(languages));
    fd.append("MaritalStatus", fieldValue(form, "MaritalStatus"));
    fd.append("HighestQualification", fieldValue(form, "HighestQualification"));
    fd.append("JoinPeriod", joinPeriod);
    fd.append("SkillList", JSON.stringify(skillList || []));

    var photoFile =
      editedPhotoFile ||
      (form.elements.namedItem("ProfilePhoto").files &&
        form.elements.namedItem("ProfilePhoto").files[0]);
    if (photoFile) fd.append("ProfilePhoto", photoFile, photoFile.name);

    appendEducationFields(fd, form);

    var resume = form.elements.namedItem("ResumeFile");
    if (resume && resume.files && resume.files[0]) {
      fd.append("ResumeFile", resume.files[0], resume.files[0].name);
    }

    return fd;
  }

  function appendEducationFields(fd, form) {
    fd.append("sslcInstitute", fieldValue(form, "sslcInstitute") || "");
    fd.append("sslcBoard", fieldValue(form, "sslcBoard") || "");
    fd.append("sslcYear", fieldValue(form, "sslcYear") || "");
    fd.append("sslcPercentage", fieldValue(form, "sslcPercentage") || "");
    fd.append(
      "sslcAttempts",
      attemptsToApiValue(fieldValue(form, "sslcAttempts") || "No Attempt")
    );
    fd.append("hscInstitute", fieldValue(form, "hscInstitute") || "");
    fd.append("hscBoard", fieldValue(form, "hscBoard") || "");
    fd.append("hscYear", fieldValue(form, "hscYear") || "");
    fd.append("hscPercentage", fieldValue(form, "hscPercentage") || "");
    fd.append(
      "hscAttempts",
      attemptsToApiValue(fieldValue(form, "hscAttempts") || "No Attempt")
    );
    fd.append("ugDegree", fieldValue(form, "ugDegree") || "");
    fd.append("ugSpec", fieldValue(form, "ugSpec") || "");
    fd.append("ugType", fieldValue(form, "ugType") || "");
    fd.append("ugYearStart", fieldValue(form, "ugYearStart") || "");
    fd.append("ugYearEnd", fieldValue(form, "ugYearEnd") || "");
    fd.append("ugPercentage", fieldValue(form, "ugPercentage") || "");
    fd.append(
      "ugArrears",
      arrearsToApiValue(fieldValue(form, "ugArrears") || "No Arrear")
    );
    fd.append("ugYear", fieldValue(form, "ugYearEnd") || "");
    fd.append("pgDegree", fieldValue(form, "pgDegree") || "");
    fd.append("pgSpec", fieldValue(form, "pgSpec") || "");
    fd.append("pgType", fieldValue(form, "pgType") || "");
    fd.append(
      "pgYearPassed",
      fieldValue(form, "pgYearEnd") || fieldValue(form, "pgYearPassed") || ""
    );
    fd.append(
      "pgArrears",
      arrearsToApiValue(fieldValue(form, "pgArrears") || "No Arrear")
    );
    fd.append("pgYearStart", fieldValue(form, "pgYearStart") || "");
    fd.append("pgYearEnd", fieldValue(form, "pgYearEnd") || "");
    fd.append("pgPercentage", fieldValue(form, "pgPercentage") || "");
    ["diploma1Degree", "diploma1Spec", "diploma1Type", "diploma1YearStart", "diploma1YearEnd", "diploma1Percentage", "phdDegree", "phdSpec", "phdType", "phdYearStart", "phdYearEnd", "phdPercentage"].forEach(function (key) {
      fd.append(key, fieldValue(form, key) || "");
    });
    fd.append("diploma1Year", fieldValue(form, "diploma1YearEnd") || "");
    fd.append(
      "diploma1Arrears",
      arrearsToApiValue(fieldValue(form, "diploma1Arrears") || "No Arrear")
    );
    fd.append("phdYear", fieldValue(form, "phdYearEnd") || "");
    fd.append(
      "phdArrears",
      arrearsToApiValue(fieldValue(form, "phdArrears") || "No Arrear")
    );
    var certs = collectCertifications(form);
    fd.append(
      "certificationsKnown",
      certs.list.length ? JSON.stringify(certs.list) : ""
    );
    fd.append(
      "skillsKnown",
      knownSkills.length ? JSON.stringify(knownSkills) : ""
    );
    fd.append("IntroVideoLink", fieldValue(form, "IntroVideoLink") || "");
    if (introAudioFile) {
      fd.append(
        "IntroAudio",
        introAudioFile,
        introAudioFile.name || "intro_recording.webm"
      );
    }
  }

  function buildEducationFormData(form, jobId) {
    var fd = new FormData();
    fd.append("Name", fieldValue(form, "Name"));
    fd.append("Phoneno", digitsOnly(fieldValue(form, "Phoneno")));
    fd.append("Email", fieldValue(form, "Email"));
    fd.append("CarrerID", String(jobId));
    appendEducationFields(fd, form);
    return fd;
  }

  /** DojoMan ResumePost expects int JoinPeriod (0/15/30/31), not label text. */
  function normalizeJoinPeriod(value) {
    var raw = String(value || "").trim();
    if (/^\d+$/.test(raw)) return raw;
    var key = raw.toLowerCase().replace(/\s+/g, " ");
    var map = {
      immediate: "0",
      "15 days": "15",
      "30 days": "30",
      "more than 30 days": "31"
    };
    return map[key] != null ? map[key] : raw;
  }

  function isHrpopsJob(job) {
    return !!(job && (job.source === "hrpops" || (job.companyId && getCompanyId())));
  }

  function resolveCompanyId(job) {
    if (job && job.companyId && Number(job.companyId) !== 0) {
      return String(job.companyId);
    }
    var fromUrl = getCompanyId();
    if (fromUrl) return fromUrl;
    var hrpops = window.NH_HRPOPS_CAREERS;
    if (hrpops && typeof hrpops.config === "function") {
      var cfg = hrpops.config();
      if (cfg && cfg.companyId) return String(cfg.companyId);
    }
    return DEFAULT_COMPANY_ID;
  }

  function handleHrpopsSuccess(data) {
    var msg = readPayloadMessage(data) || "Application submitted successfully.";
    var already =
      /already applied/i.test(msg) || /already exists/i.test(msg);
    if (already) {
      setStatus(msg, "error");
      return "already";
    }
    setStatus(
      /success/i.test(msg) || !msg
        ? "Application submitted successfully."
        : msg,
      "ok"
    );
    return "ok";
  }

  function optionLabel(form, name) {
    var el = form.elements.namedItem(name);
    if (!el || !el.options || el.selectedIndex < 0) return "";
    var opt = el.options[el.selectedIndex];
    if (!opt || !opt.value) return "";
    return (opt.textContent || "").trim();
  }

  function genderLabel(value) {
    if (value === "1") return "Male";
    if (value === "2") return "Female";
    if (value === "3") return "Others";
    return value || "";
  }

  function educationNote(form) {
    var bits = [];
    function add(label, keys) {
      var parts = keys
        .map(function (key) {
          return fieldValue(form, key);
        })
        .filter(Boolean);
      if (parts.length) bits.push(label + ": " + parts.join(", "));
    }
    add("10th", ["sslcInstitute", "sslcBoard", "sslcYear", "sslcPercentage"]);
    add("12th", ["hscInstitute", "hscBoard", "hscYear", "hscPercentage"]);
    add("Diploma", ["diploma1Degree", "diploma1Spec", "diploma1YearEnd"]);
    add("UG", ["ugDegree", "ugSpec", "ugYearEnd", "ugPercentage"]);
    add("PG", ["pgDegree", "pgSpec", "pgYearEnd", "pgPercentage"]);
    add("Doctorate", ["phdDegree", "phdSpec", "phdYearEnd"]);
    var yt = fieldValue(form, "IntroVideoLink");
    if (yt) bits.push("Intro video: " + yt);
    if (knownSkills.length) {
      bits.push(
        "Other skills: " +
          knownSkills
            .map(function (skill) {
              return skill.name;
            })
            .filter(Boolean)
            .join(", ")
      );
    }
    return bits.join(" | ");
  }

  function buildHrpopsFormData(form, job, isIntern, skillList, languages) {
    var fd = new FormData();
    var personalState = fieldValue(form, "StateID");
    var personalCity = fieldValue(form, "CityID");
    var currentState = fieldValue(form, "CurrentStateID");
    var currentCity = fieldValue(form, "CurrentCityID");
    var pincode = fieldValue(form, "CurrentPincode");
    var address = joinAddress(fieldValue(form, "Address"), fieldValue(form, "Address2"));
    var permanent = joinAddress(
      fieldValue(form, "PermanentAddress"),
      fieldValue(form, "PermanentAddress2")
    );
    var experienceCode = fieldValue(form, "Experience");
    var experienceYears = { "1": "0", "2": "2", "3": "4", "4": "6", "5": "10", "6": "11" };
    var experience = isIntern
      ? "0"
      : experienceYears[experienceCode] || experienceCode || "0";
    var expectedSalary = isIntern
      ? fieldValue(form, "ExpectedStipend") || "0"
      : fieldValue(form, "ExpectedSalary");
    var joinPeriod = (fieldValue(form, "JoinPeriod") || "").trim();
    var currentSalary = isIntern ? "" : fieldValue(form, "CurrentSalary");
    var reasonQuit = isIntern ? "" : fieldValue(form, "ReasonForQuit");
    var workMode = fieldValue(form, "WorkModePreference");
    if (workMode === "Office") workMode = "Work From Office";
    var about = fieldValue(form, "AboutYourSelf");
    var extra = educationNote(form);
    if (extra) about = about ? about + "\n" + extra : extra;
    var relocate = String(fieldValue(form, "ReadyToRelocate")).toLowerCase() === "no"
      ? "false"
      : "true";

    fd.append("JobPostID", String(job.jobid));
    fd.append("CandidateName", fieldValue(form, "Name"));
    fd.append("Dob", fieldValue(form, "Dob"));
    fd.append("Gender", genderLabel(fieldValue(form, "Gender")));
    fd.append("PhoneNumber", digitsOnly(fieldValue(form, "Phoneno")));
    fd.append("Email", fieldValue(form, "Email"));
    fd.append("Experience", experience);
    fd.append("AboutYourSelf", about);
    fd.append("ExpectedSalary", expectedSalary);
    fd.append("JoinPeriod", joinPeriod);
    fd.append("PermanentAddress", permanent);
    fd.append("CurrentAddress", address);
    fd.append("Relocated", relocate);
    fd.append("Pincode", fieldValue(form, "PermanentPincode") || pincode);
    fd.append("CountryId", HRPOPS_COUNTRY_ID);
    fd.append("CurrentCountryId", HRPOPS_COUNTRY_ID);
    var permState = fieldValue(form, "PermanentStateID") || personalState;
    var permCity = fieldValue(form, "PermanentCityID") || personalCity;
    if (permState) fd.append("StateId", permState);
    if (permCity) fd.append("CityId", permCity);
    if (currentState) fd.append("CurrentStateId", currentState);
    if (currentCity) fd.append("CurrentCityId", currentCity);
    fd.append("CurrentPincode", pincode);
    fd.append("CurrentCTC", currentSalary);
    fd.append("WorkModePreference", workMode);
    fd.append("MaritalStatus", fieldValue(form, "MaritalStatus"));
    fd.append("HighestQualification", fieldValue(form, "HighestQualification"));
    fd.append("InterviewMode", fieldValue(form, "InterviewMode1"));
    fd.append("ReasonForQuit", reasonQuit);
    fd.append(
      "LanguagesJson",
      JSON.stringify(
        enforceOneMotherTongue(languages || []).map(function (row) {
          return {
            language: row.language || row.name || "",
            read: row.read || "",
            write: row.write || "",
            speak: row.speak || "",
            isMotherTongue: !!row.isMotherTongue
          };
        })
      )
    );

    var skillIndex = 0;
    var jobPostId = String(job.jobid);
    var seenSkills = {};
    function appendSkill(name, skillId, year, month, rating) {
      var label = String(name || "").trim();
      if (!label) return;
      var key = label.toLowerCase();
      if (seenSkills[key]) return;
      seenSkills[key] = true;
      var prefix = "skillsRating[" + skillIndex + "].";
      fd.append(prefix + "JobpostId", jobPostId);
      fd.append(prefix + "SkillId", String(skillId || 0));
      fd.append(prefix + "Skill", label);
      fd.append(prefix + "ExperienceYear", String(year || 0));
      fd.append(prefix + "ExperienceMonth", String(month || 0));
      fd.append(prefix + "Rating", String(rating || 2));
      skillIndex += 1;
    }
    (skillList || []).forEach(function (row) {
      if (!row) return;
      appendSkill(row.skill, row.skillid, row.year, row.month, row.rating);
    });
    knownSkills.forEach(function (ks) {
      if (!ks) return;
      appendSkill(ks.name, 0, 0, 0, 2);
    });

    var photoFile =
      editedPhotoFile ||
      (form.elements.namedItem("ProfilePhoto").files &&
        form.elements.namedItem("ProfilePhoto").files[0]);
    if (photoFile) fd.append("ProfilePic", photoFile, photoFile.name);

    var resume = form.elements.namedItem("ResumeFile");
    if (resume && resume.files && resume.files[0]) {
      fd.append("Resume", resume.files[0], resume.files[0].name);
    }
    return fd;
  }

  function readPayloadMessage(data) {
    if (!data) return "";
    if (Array.isArray(data)) return readPayloadMessage(data[0]);
    var raw = String(
      data.reason || data.Reason || data.message || data.Message || ""
    ).trim();
    if (/^(null|undefined)$/i.test(raw)) return "";
    return raw;
  }

  function statusFromFailure(data, status) {
    var detail = readPayloadMessage(data);
    var msg = detail || "The application was not accepted. Please check the form and try again.";
    if (status && Number(status) >= 400) msg += " (HTTP " + status + ")";
    return msg;
  }

  function handleApiSuccess(data0) {
    var msg = data0.message || data0.Message || "";
    var reason = data0.reason || data0.Reason || "";
    if (String(msg).toLowerCase() === "success") {
      if (
        String(reason).indexOf("Basic Details Already Applied") === 0 ||
        String(reason).indexOf("Already applied for this job post.") === 0
      ) {
        setStatus(reason, "error");
        return "already";
      }
      setStatus(
        reason
          ? reason === "Basic Details Applied"
            ? "Application submitted successfully."
            : "Application submitted - " + reason
          : "Application submitted successfully.",
        "ok"
      );
      return "ok";
    }
    if (String(msg).toLowerCase() === "fail") {
      setStatus(
        "DojoMan: " +
          (reason || "The application was not accepted. Please check the form and try again."),
        "error"
      );
      return "fail";
    }
    setStatus(
      reason || msg || "Something went wrong. Please try again later.",
      "error"
    );
    return "fail";
  }

  function renderNotFound(id, note) {
    var hero = qs("#pr-hero");
    var title = qs("#pr-title");
    var meta = qs("#pr-meta");
    var main = qs("#pr-main");

    if (hero) hero.classList.add("is-not-found");
    if (title) title.textContent = "Role not found";
    if (meta) {
      meta.hidden = true;
      meta.innerHTML = "";
    }
    document.title = "Role not found | Nohitatu";
    if (main) {
      main.innerHTML =
        '<div class="pr-not-found">' +
        "<h2>We couldn\u2019t find that opening</h2>" +
        "<p>" +
        (id
          ? 'Job code <strong class="pr-code">' +
            escapeHtml(id) +
            "</strong> was not found in open HRPops roles, or the link may be outdated."
          : "No job code was provided in the URL.") +
        "</p>" +
        (note ? "<p>" + escapeHtml(note) + "</p>" : "") +
        '<a class="pr-btn pr-btn-ink" href="Careers.html">View open positions <span aria-hidden="true">&#8594;</span></a>' +
        "</div>";
    }
  }

  function sectionHead(num, title) {
    /* Use <div>, not <header>: global style.css forces every `header` to
       position:fixed + z-index 99999 (site nav chrome). Section titles were
       stacking at the viewport top and ghosting under each other. */
    return (
      '<div class="pr-section-head">' +
      "<h2>" +
      title +
      "</h2></div>"
    );
  }

  function revealForm(form) {
    if (!form) return;
    form.classList.add("pr-form--motion");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        form.classList.add("is-revealed");
      });
    });
  }

  function wirePhoneDigits(form) {
    var phone = form.elements.namedItem("Phoneno");
    if (phone) {
      phone.addEventListener("input", function () {
        var digits = digitsOnly(phone.value);
        if (phone.value !== digits) phone.value = digits;
      });
    }
    ["CurrentPincode", "PermanentPincode"].forEach(function (name) {
      var pinEl = form.elements.namedItem(name);
      if (!pinEl) return;
      pinEl.addEventListener("input", function () {
        var digits = pincodeDigits(pinEl.value);
        if (pinEl.value !== digits) pinEl.value = digits;
      });
    });
  }

  function wireSameAsCurrent(form) {
    var box = form.elements.namedItem("sameAsCurrent");
    if (!box) return;
    box.addEventListener("change", function () {
      if (!box.checked) return;
      form.elements.namedItem("PermanentAddress").value =
        form.elements.namedItem("Address").value;
      var a2 = form.elements.namedItem("Address2");
      var p2 = form.elements.namedItem("PermanentAddress2");
      if (a2 && p2) p2.value = a2.value;
      form.elements.namedItem("PermanentPincode").value =
        form.elements.namedItem("CurrentPincode").value;
      var cs = form.elements.namedItem("CurrentStateID");
      var ps = form.elements.namedItem("PermanentStateID");
      if (cs && ps) {
        ps.value = cs.value;
        loadCities(cs.value, form.elements.namedItem("PermanentCityID")).then(
          function () {
            form.elements.namedItem("PermanentCityID").value =
              form.elements.namedItem("CurrentCityID").value;
          }
        );
      }
    });
  }

  function wireOldForm(form) {
    var tabs = qsa("[data-pr-tab]", form);
    var panels = qsa("[data-pr-panel]", form);
    function showPanel(name) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-pr-tab") === name;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-pr-panel") !== name;
      });
    }
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        showPanel(tab.getAttribute("data-pr-tab"));
      });
    });
    var nextEdu = qs("#pr-next-education", form);
    if (nextEdu) {
      nextEdu.addEventListener("click", function () {
        showPanel("education");
        var eduTab = qs('[data-pr-tab="education"]', form);
        if (eduTab) {
          try {
            eduTab.focus();
          } catch (e) {}
        }
        var eduPanel = qs('[data-pr-panel="education"]', form);
        if (eduPanel) {
          try {
            eduPanel.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch (e2) {}
        }
      });
    }

    var steps = qsa("[data-edu-step]", form);
    var eduForms = qsa("[data-edu-form]", form);
    function showStep(name) {
      steps.forEach(function (step) {
        step.classList.toggle("active", step.getAttribute("data-edu-step") === name);
      });
      eduForms.forEach(function (block) {
        block.hidden = block.getAttribute("data-edu-form") !== name;
      });
    }
    steps.forEach(function (step) {
      step.addEventListener("click", function () {
        showStep(step.getAttribute("data-edu-step"));
      });
    });

    function clearSingleFieldError(ev) {
      var target = ev.target;
      if (!target || !target.classList) return;
      if (target.type !== "checkbox" && target.type !== "radio" && !String(target.value || "").trim()) {
        return;
      }
      target.classList.remove("is-invalid");
      var field = target.closest ? target.closest(".pr-field, .pr-declare") : null;
      if (field) field.classList.remove("pr-field--invalid");
      var eduForm = target.closest ? target.closest("[data-edu-form]") : null;
      if (eduForm && !qs(".is-invalid", eduForm)) {
        var stepName = eduForm.getAttribute("data-edu-form");
        var stepBtn = qs('[data-edu-step="' + stepName + '"]', form);
        if (stepBtn) stepBtn.classList.remove("is-invalid");
      }
    }
    form.addEventListener("input", clearSingleFieldError);
    form.addEventListener("change", clearSingleFieldError);

    wireKnownSkills(form);
    wireCertifications(form);
    wireYouTube(form);
    wireAudio(form);
    wirePhoto(form);
  }

  function knownSkillsMarkup() {
    /* CandidateSkills / Skills Known - always shown on Job Application Skills section */
    return (
      '<div class="pr-known-skills" id="pr-known-skills">' +
      '<label class="pr-skill-entry-label" for="skill-entry">Your skills <span class="pr-req">*</span></label>' +
      '<div class="skills-input-wrapper">' +
      '<input id="skill-entry" name="skill-entry" class="skill-field" type="text" maxlength="40" placeholder="Enter your skill or expertise" autocomplete="off" />' +
      '<label class="pr-certified"><input type="checkbox" id="skill-certified" />Certified</label>' +
      '<button type="button" class="skill-add-button" id="skill-add">Add</button></div>' +
      '<div id="skill-tags" class="skills-tags-container" hidden></div></div>'
    );
  }

  function renderKnownSkills(form) {
    var root = form || document;
    var box = qs("#skill-tags", root);
    if (!box) return;
    box.hidden = knownSkills.length === 0;
    box.innerHTML = knownSkills
      .map(function (skill, index) {
        var label = skill.name + (skill.certified ? " (Certified)" : "");
        return (
          '<span class="skill-tag"><span class="skill-text">' +
          escapeHtml(label) +
          '</span><button type="button" class="skill-remove" data-i="' +
          index +
          '" aria-label="Remove skill">&times;</button></span>'
        );
      })
      .join("");
  }

  function wireKnownSkills(form) {
    var root = form || document;
    var entry = qs("#skill-entry", root);
    var addBtn = qs("#skill-add", root);
    var box = qs("#skill-tags", root);
    var certified = qs("#skill-certified", root);
    if (!entry || !addBtn || !box) return;
    if (entry.getAttribute("data-pr-wired") === "1") return;
    entry.setAttribute("data-pr-wired", "1");
    knownSkills = [];
    function addSkill() {
      var value = entry.value.trim();
      if (!value || knownSkills.length >= 20) return;
      if (
        knownSkills.some(function (skill) {
          return skill.name.toLowerCase() === value.toLowerCase();
        })
      ) {
        entry.value = "";
        return;
      }
      knownSkills.push({ name: value, certified: !!(certified && certified.checked) });
      entry.value = "";
      if (certified) certified.checked = false;
      renderKnownSkills(root);
    }
    addBtn.addEventListener("click", addSkill);
    entry.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        addSkill();
      }
    });
    box.addEventListener("click", function (event) {
      var btn = event.target.closest(".skill-remove");
      if (!btn) return;
      knownSkills.splice(parseInt(btn.getAttribute("data-i"), 10), 1);
      renderKnownSkills(root);
    });
  }

  /** If Skills Known input is missing (old markup / empty preset path), inject it above #pr-skills. */
  function ensureKnownSkillsUi(form) {
    var root = form || qs("#pr-form") || document;
    var section = qs("#skills-section", root);
    if (!section) return;
    if (qs("#skill-entry", section)) {
      wireKnownSkills(root);
      return;
    }
    var presets = qs("#pr-skills", section);
    var wrap = document.createElement("div");
    wrap.innerHTML = knownSkillsMarkup();
    var node = wrap.firstChild;
    if (presets) section.insertBefore(node, presets);
    else section.appendChild(node);
    wireKnownSkills(root);
  }

  function certRowHtml() {
    return (
      '<div class="pr-cert-row pr-grid" data-cert-row>' +
      '<div class="pr-field"><label>Category <span class="pr-req">*</span></label>' +
      '<select data-cert="category"><option value="">Select Category</option>' +
      '<option value="Technical">Technical</option><option value="Non-Technical">Non-Technical</option></select></div>' +
      '<div class="pr-field"><label>Name <span class="pr-req">*</span></label>' +
      '<input data-cert="name" type="text" maxlength="80" placeholder="Enter certification name" /></div>' +
      '<div class="pr-field"><label>Institution <span class="pr-req">*</span></label>' +
      '<input data-cert="institute" type="text" maxlength="80" placeholder="Enter institution name" /></div>' +
      '<div class="pr-field"><label>Duration <span class="pr-req">*</span></label>' +
      '<input data-cert="duration" type="text" maxlength="40" placeholder="e.g., 3 months" /></div>' +
      '<button type="button" class="cert-remove">Remove</button></div>'
    );
  }

  function wireCertifications(form) {
    var add = qs("#cert-add", form);
    var rows = qs("#cert-rows", form);
    if (!add || !rows) return;
    if (!rows.children.length) {
      rows.insertAdjacentHTML("beforeend", certRowHtml());
    }
    add.addEventListener("click", function () {
      rows.insertAdjacentHTML("beforeend", certRowHtml());
    });
    rows.addEventListener("click", function (event) {
      var btn = event.target.closest(".cert-remove");
      if (!btn) return;
      var row = btn.closest("[data-cert-row]");
      if (row) row.remove();
      if (!rows.children.length) {
        rows.insertAdjacentHTML("beforeend", certRowHtml());
      }
    });
  }

  function wireYouTube(form) {
    var input = form.elements.namedItem("IntroVideoLink");
    var err = qs("#yt-error", form);
    if (!input) return;
    input.addEventListener("input", function () {
      var bad = input.value.trim() && !isYouTube(input.value.trim());
      input.classList.toggle("is-invalid", !!bad);
      if (err) err.hidden = !bad;
    });
  }

  function padTime(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function stopRecorder() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    if (recordingTimer) {
      clearInterval(recordingTimer);
      recordingTimer = null;
    }
  }

  function wireAudio(form) {
    var start = qs("#rec-start", form);
    var stop = qs("#rec-stop", form);
    var again = qs("#rec-again", form);
    var time = qs("#rec-time", form);
    var preview = qs("#rec-preview", form);
    if (!start || !stop || !again) return;
    introAudioFile = null;

    function showIdle() {
      start.hidden = false;
      stop.hidden = true;
      again.hidden = true;
      if (time) time.hidden = true;
      if (preview) {
        preview.hidden = true;
        preview.removeAttribute("src");
      }
    }

    function showSaved() {
      start.hidden = true;
      stop.hidden = true;
      again.hidden = false;
      if (time) time.hidden = true;
      if (preview) preview.hidden = false;
    }

    again.addEventListener("click", function () {
      if (preview && preview.src) URL.revokeObjectURL(preview.src);
      introAudioFile = null;
      showIdle();
      start.click();
    });

    stop.addEventListener("click", function () {
      stopRecorder();
    });

    start.addEventListener("click", function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus("This browser cannot record audio. Use a current Chrome or Edge.", "error");
        return;
      }
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(function (stream) {
          var chunks = [];
          var seconds = 0;
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = function (ev) {
            if (ev.data && ev.data.size > 0) chunks.push(ev.data);
          };
          mediaRecorder.onstop = function () {
            stream.getTracks().forEach(function (track) {
              track.stop();
            });
            var blob = new Blob(chunks, { type: "audio/webm" });
            introAudioFile = new File([blob], "intro_recording.webm", {
              type: "audio/webm"
            });
            if (preview) {
              if (preview.src) URL.revokeObjectURL(preview.src);
              preview.src = URL.createObjectURL(blob);
            }
            showSaved();
          };
          mediaRecorder.start();
          start.hidden = true;
          stop.hidden = false;
          again.hidden = true;
          if (time) {
            time.hidden = false;
            time.textContent = "0:00";
          }
          recordingTimer = setInterval(function () {
            seconds += 1;
            if (time) time.textContent = Math.floor(seconds / 60) + ":" + padTime(seconds % 60);
            if (seconds >= 120) stopRecorder();
          }, 1000);
        })
        .catch(function () {
          setStatus(
            "Microphone access is required to record audio. Allow the microphone and try again.",
            "error"
          );
        });
    });
  }

  function ensureFaceModels() {
    if (faceApiReady) return Promise.resolve(true);
    if (typeof faceapi === "undefined") {
      console.warn("FaceAPI not found globally");
      return Promise.resolve(false);
    }
    return faceapi.nets.tinyFaceDetector
      .loadFromUri(FACE_MODEL_URI)
      .then(function () {
        faceApiReady = true;
        return true;
      })
      .catch(function (err) {
        console.error("Failed to load FaceAPI models", err);
        return false;
      });
  }

  function setPhotoMsg(text, kind) {
    var el = document.getElementById("pr-photo-msg");
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.className = "pr-hint" + (kind ? " is-" + kind : "");
  }

  function destroyPhotoCropper() {
    if (photoCropper) {
      photoCropper.destroy();
      photoCropper = null;
    }
  }

  function openPhotoEditor() {
    var editor = document.getElementById("pr-photo-editor");
    var img = document.getElementById("pr-photo-img");
    if (!editor || !img || !photoDataUrl) return;
    editor.hidden = false;
    destroyPhotoCropper();
    function start() {
      img.onload = null;
      if (typeof Cropper !== "function") {
        setPhotoMsg("Photo cropper failed to load. Refresh and try again.", "error");
        return;
      }
      photoCropper = new Cropper(img, {
        viewMode: 1,
        dragMode: "crop",
        aspectRatio: NaN,
        autoCropArea: 0.85,
        responsive: true,
        background: false,
        movable: true,
        zoomable: true,
        rotatable: true,
        cropBoxMovable: true,
        cropBoxResizable: true
      });
    }
    if (img.getAttribute("src") === photoDataUrl && img.complete && img.naturalWidth) {
      start();
      return;
    }
    img.onload = start;
    img.src = photoDataUrl;
  }

  function clearPhotoInput(input) {
    input.value = "";
    editedPhotoFile = null;
    photoDataUrl = "";
    destroyPhotoCropper();
    var edit = document.getElementById("pr-photo-edit");
    if (edit) edit.hidden = true;
    var editor = document.getElementById("pr-photo-editor");
    if (editor) editor.hidden = true;
  }

  async function verifySingleFace(file) {
    var ready = await ensureFaceModels();
    if (!ready || typeof faceapi === "undefined") return "skip";
    setPhotoMsg("Scanning photo... verifying face.", "");
    try {
      var source = await faceapi.bufferToImage(file);
      var maxW = 400;
      var canvas = document.createElement("canvas");
      var w = source.width;
      var h = source.height;
      if (w >maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(source, 0, 0, w, h);
      var opts = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.1
      });
      var faces = await faceapi.detectAllFaces(canvas, opts);
      if (!faces.length) return "none";
      if (faces.length > 1) return "group";
      return "ok";
    } catch (err) {
      console.error("Face detection check failed:", err);
      return "skip";
    }
  }

  function wirePhoto(form) {
    var input = form.elements.namedItem("ProfilePhoto");
    var edit = qs("#pr-photo-edit", form);
    var editor = document.getElementById("pr-photo-editor");
    var rotate = document.getElementById("pr-photo-rotate");
    var save = document.getElementById("pr-photo-save");
    var close = document.getElementById("pr-photo-close");
    if (!input || !editor) return;
    editedPhotoFile = null;
    photoDataUrl = "";
    destroyPhotoCropper();
    ensureFaceModels();

    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (!file) return;
      if (!PHOTO_NAME_RE.test(file.name)) {
        clearPhotoInput(input);
        setPhotoMsg(
          "Only (.jpg, .jpeg, .png, .bmp, .gif) file extensions are allowed",
          "error"
        );
        return;
      }
      photoFileName = file.name || "profile.png";
      verifySingleFace(file).then(function (result) {
        if (result === "none") {
          clearPhotoInput(input);
          setPhotoMsg(
            "No face detected. Please upload a photo showing your face clearly.",
            "error"
          );
          return;
        }
        if (result === "group") {
          clearPhotoInput(input);
          setPhotoMsg(
            "Group photos not allowed. Please upload a single person photo.",
            "error"
          );
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          photoDataUrl = String(reader.result || "");
          if (edit) edit.hidden = false;
          if (result === "ok") setPhotoMsg("Face verified successfully.", "ok");
          else setPhotoMsg("", "");
          openPhotoEditor();
        };
        reader.readAsDataURL(file);
      });
    });
    if (edit) {
      edit.addEventListener("click", function () {
        if (photoDataUrl) openPhotoEditor();
      });
    }
    if (rotate) {
      rotate.addEventListener("click", function () {
        if (photoCropper) photoCropper.rotate(90);
      });
    }
    if (close) {
      close.addEventListener("click", function () {
        editor.hidden = true;
      });
    }
    if (save) {
      save.addEventListener("click", function () {
        if (!photoCropper) return;
        var canvas = photoCropper.getCroppedCanvas({
          maxWidth: 1200,
          maxHeight: 1200,
          imageSmoothingQuality: "high"
        });
        if (!canvas) return;
        var outName = photoFileName.replace(/\.[^.]+$/, "") + ".png";
        canvas.toBlob(function (blob) {
          if (!blob) return;
          editedPhotoFile = new File([blob], outName || "profile.png", {
            type: "image/png"
          });
          try {
            var dt = new DataTransfer();
            dt.items.add(editedPhotoFile);
            input.files = dt.files;
          } catch (e) {
            /* keep editedPhotoFile for submit */
          }
          editor.hidden = true;
          setPhotoMsg("Cropped photo saved.", "ok");
        }, "image/png");
      });
    }
  }

  function onExperienceChange(form) {
    var exp = fieldValue(form, "Experience");
    var expBlock = qs("#pr-exp-extra");
    if (expBlock) expBlock.hidden = exp === "1" || exp === "";
  }

  /* -- Save draft (localStorage; text/select/checkbox only - no file blobs) -- */
  var DRAFT_PREFIX = "nh-pr-draft:";

  function draftStorageKey(job) {
    var jobId = String((job && job.jobid) || getId() || "").trim();
    var company = String(
      (job && job.companyId) || getCompanyId() || ""
    ).trim();
    return DRAFT_PREFIX + jobId + ":" + company;
  }

  function collectDraftFields(form) {
    var fields = {};
    qsa("input, select, textarea", form).forEach(function (el) {
      var name = el.name;
      if (!name) return;
      if (el.type === "file" || el.type === "button" || el.type === "submit") {
        return;
      }
      if (name === "skill-entry") return;
      if (/^langMother\d+$/.test(name)) return;
      if (el.type === "checkbox") {
        fields[name] = !!el.checked;
        return;
      }
      if (el.type === "radio") {
        if (el.checked) fields[name] = el.value;
        return;
      }
      fields[name] = el.value;
    });
    return fields;
  }

  function collectDraftLanguages(form) {
    return collectLanguages(qs("#pr-languages", form)).map(function (lang) {
      return {
        name: lang.name,
        read: lang.read,
        write: lang.write,
        speak: lang.speak,
        motherTongue: lang.motherTongue,
        isMotherTongue: !!lang.isMotherTongue
      };
    });
  }

  function collectDraftSkillRatings(form) {
    return qsa(".pr-skill-row", form).map(function (row) {
      var rate = row.querySelector(".pr-skill-rate");
      var year = row.querySelector(".pr-skill-year");
      var month = row.querySelector(".pr-skill-month");
      return {
        skillId: row.getAttribute("data-skill-id") || "",
        rating: rate ? rate.value : "",
        year: year ? year.value : "",
        month: month ? month.value : ""
      };
    });
  }

  function activePrPanel(form) {
    var panel = qs("[data-pr-panel]:not([hidden])", form);
    return panel ? panel.getAttribute("data-pr-panel") : "job";
  }

  function activeEduStep(form) {
    var step = qs("[data-edu-step].active", form);
    return step ? step.getAttribute("data-edu-step") : "10th";
  }

  function readDraft(job) {
    try {
      var raw = localStorage.getItem(draftStorageKey(job));
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return null;
      return data;
    } catch (err) {
      console.warn("Draft read failed", err);
      return null;
    }
  }

  function clearDraft(job) {
    try {
      localStorage.removeItem(draftStorageKey(job));
    } catch (err) {
      /* ignore */
    }
  }

  function saveDraft(form, job) {
    if (!form || !job) return;
    var payload = {
      v: 1,
      savedAt: Date.now(),
      jobId: String(job.jobid),
      companyId: String(job.companyId || getCompanyId() || ""),
      fields: collectDraftFields(form),
      knownSkills: knownSkills.slice(),
      languages: collectDraftLanguages(form),
      certifications: collectCertifications(form).list,
      skillRatings: collectDraftSkillRatings(form),
      activePanel: activePrPanel(form),
      activeEduStep: activeEduStep(form)
    };
    try {
      localStorage.setItem(draftStorageKey(job), JSON.stringify(payload));
      setStatus("Draft saved", "ok");
    } catch (err) {
      console.warn(err);
      setStatus(
        "Could not save draft (browser storage may be full or blocked).",
        "error"
      );
    }
  }

  function applyDraftFields(form, fields) {
    if (!fields) return;
    Object.keys(fields).forEach(function (name) {
      var val = fields[name];
      var el = form.elements.namedItem(name);
      if (!el) return;
      if (el.length && el[0] && el[0].type === "radio") {
        qsa('input[name="' + name + '"]', form).forEach(function (radio) {
          radio.checked = radio.value === String(val);
        });
        return;
      }
      if (el.type === "checkbox") {
        el.checked = !!val;
        return;
      }
      if (el.type === "radio") {
        el.checked = el.value === String(val);
        return;
      }
      if (el.type === "file") return;
      el.value = val == null ? "" : String(val);
    });
  }

  function restoreDraftLanguages(form, languages) {
    var box = qs("#pr-languages", form);
    if (!box) return;
    knownLanguages = [];
    langUid = 0;
    var list = enforceOneMotherTongue(
      Array.isArray(languages) ? languages : []
    );
    list.forEach(function (lang) {
      var name = lang.name || lang.language || "";
      var read = lang.read || "";
      var write = lang.write || "";
      var speak = lang.speak || "";
      if (!name || !read || !write || !speak) return;
      langUid += 1;
      knownLanguages.push({
        uid: langUid,
        name: name,
        read: read,
        write: write,
        speak: speak,
        motherTongue: lang.motherTongue,
        isMotherTongue: !!lang.isMotherTongue
      });
    });
    resetLanguageEntry(box);
    renderKnownLanguages(box);
  }

  function restoreDraftCerts(form, certs) {
    var rows = qs("#cert-rows", form);
    if (!rows) return;
    rows.innerHTML = "";
    var list = Array.isArray(certs) && certs.length ? certs : [{}];
    list.forEach(function (cert) {
      rows.insertAdjacentHTML("beforeend", certRowHtml());
      var row = rows.lastElementChild;
      if (!row || !cert) return;
      var cat = qs('[data-cert="category"]', row);
      var name = qs('[data-cert="name"]', row);
      var inst = qs('[data-cert="institute"]', row);
      var dur = qs('[data-cert="duration"]', row);
      if (cat) cat.value = cert.category || "";
      if (name) name.value = cert.name || "";
      if (inst) inst.value = cert.institute || "";
      if (dur) dur.value = cert.duration || "";
    });
  }

  function restoreDraftSkillRatings(form, ratings) {
    if (!Array.isArray(ratings) || !ratings.length) return;
    var byId = {};
    ratings.forEach(function (r) {
      if (r && r.skillId != null) byId[String(r.skillId)] = r;
    });
    qsa(".pr-skill-row", form).forEach(function (row) {
      var id = row.getAttribute("data-skill-id");
      var saved = byId[String(id)];
      if (!saved) return;
      var rate = row.querySelector(".pr-skill-rate");
      var year = row.querySelector(".pr-skill-year");
      var month = row.querySelector(".pr-skill-month");
      if (rate) {
        rate.value = saved.rating || "";
        try {
          rate.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (e) {
          /* ignore */
        }
      }
      if (year && saved.year !== undefined && saved.year !== "") {
        year.value = String(saved.year);
      }
      if (month && saved.month !== undefined && saved.month !== "") {
        month.value = String(saved.month);
      }
    });
  }

  function showDraftPanel(form, panelName) {
    var name = panelName || "job";
    qsa("[data-pr-panel]", form).forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-pr-panel") !== name;
    });
    qsa("[data-pr-tab]", form).forEach(function (tab) {
      var on = tab.getAttribute("data-pr-tab") === name;
      tab.classList.toggle("active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function showDraftEduStep(form, stepName) {
    var name = stepName || "10th";
    qsa("[data-edu-step]", form).forEach(function (step) {
      step.classList.toggle(
        "active",
        step.getAttribute("data-edu-step") === name
      );
    });
    qsa("[data-edu-form]", form).forEach(function (block) {
      block.hidden = block.getAttribute("data-edu-form") !== name;
    });
  }

  async function restoreDraft(form, job, draft, isIntern) {
    if (!form || !draft) return;
    applyDraftFields(form, draft.fields || {});

    var stateCityPairs = [
      ["StateID", "CityID"],
      ["CurrentStateID", "CurrentCityID"],
      ["PermanentStateID", "PermanentCityID"]
    ];
    var i;
    for (i = 0; i < stateCityPairs.length; i++) {
      var stateName = stateCityPairs[i][0];
      var cityName = stateCityPairs[i][1];
      var stateEl = form.elements.namedItem(stateName);
      var cityEl = form.elements.namedItem(cityName);
      var savedCity =
        draft.fields && draft.fields[cityName] != null
          ? String(draft.fields[cityName])
          : "";
      if (stateEl && cityEl && stateEl.value) {
        await loadCities(stateEl.value, cityEl);
        if (savedCity) cityEl.value = savedCity;
      }
    }

    if (!isIntern) onExperienceChange(form);

    restoreDraftLanguages(form, draft.languages);
    knownSkills = Array.isArray(draft.knownSkills)
      ? draft.knownSkills
          .filter(function (s) {
            return s && s.name;
          })
          .map(function (s) {
            return { name: String(s.name), certified: !!s.certified };
          })
      : [];
    renderKnownSkills(form);
    restoreDraftCerts(form, draft.certifications);
    restoreDraftSkillRatings(form, draft.skillRatings);
    showDraftPanel(form, draft.activePanel);
    showDraftEduStep(form, draft.activeEduStep);

    setStatus(
      "Draft restored. Re-attach photo and resume if needed - files are not saved in drafts.",
      "ok"
    );
  }

  async function wireDraft(form, job, isIntern) {
    if (!form || !job) return;
    form.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-pr-save-draft]");
      if (!btn || !form.contains(btn)) return;
      ev.preventDefault();
      saveDraft(form, job);
    });

    var existing = readDraft(job);
    if (!existing) return;
    var sameJob =
      String(existing.jobId || "") === String(job.jobid) ||
      !existing.jobId;
    if (!sameJob) return;

    var shouldRestore = true;
    try {
      shouldRestore = window.confirm(
        "A saved draft was found for this job. Restore saved draft?"
      );
    } catch (e) {
      shouldRestore = true;
    }
    if (shouldRestore) {
      await restoreDraft(form, job, existing, isIntern);
    }
  }

  function buildFormMarkup(job, isIntern) {
    var stateOpts = optionList(STATES, "stateId", "stateName", "Select State");
    var years = yearOptions(1950, new Date().getFullYear(), "Select Year");
    var attemptOpts = attemptOptsHtml();
    var arrearOpts = arrearOptsHtml();
    langUid = 1;
    knownLanguages = [];
    var maritalField =
      '<div class="pr-field"><label for="MaritalStatus">Marital Status <span class="pr-req">*</span></label>' +
      '<div class="pr-radios" role="radiogroup" id="MaritalStatus">' +
      '<label><input type="radio" name="MaritalStatus" value="Single" />Single</label>' +
      '<label><input type="radio" name="MaritalStatus" value="Married" />Married</label></div></div>';

    return (
      '<form id="pr-form" class="pr-form" novalidate>' +
      '<input type="hidden" name="JobPostID" value="' +
      escapeHtml(String(job.jobid)) +
      '" />' +
      '<input type="hidden" name="CountryID" value="' +
      HRPOPS_COUNTRY_ID +
      '" />' +
      '<p class="pr-lead">Fields marked <span class="pr-req">*</span>are required.</p>' +
      '<div id="pr-status" class="pr-status" hidden role="status"></div>' +
      '<ul class="preview-tabs" role="tablist">' +
      '<li class="preview-tab-item"><button type="button" class="preview-tab-link active" data-pr-tab="job" role="tab">Job Application</button></li>' +
      '<li class="preview-tab-item"><button type="button" class="preview-tab-link" data-pr-tab="education" role="tab">Education &amp; Certifications</button></li>' +
      "</ul>" +
      '<div class="pr-old-panel" data-pr-panel="job">' +
      /* PERSONAL */ '<section class="pr-section" id="pr-personal">' +
      sectionHead("01", "Personal details") +
      '<div class="pr-grid pr-grid--personal">' +
      '<div class="pr-field"><label for="Name">Name <span class="pr-req">*</span></label>' +
      '<input id="Name" name="Name" type="text" placeholder="Enter your name" autocomplete="name" minlength="3" maxlength="50" required /></div>' +
      '<div class="pr-field"><label for="Dob">Date of Birth <span class="pr-req">*</span></label>' +
      '<input id="Dob" name="Dob" type="date" required /></div>' +
      '<div class="pr-field"><label for="Gender">Gender <span class="pr-req">*</span></label>' +
      '<select id="Gender" name="Gender" required><option value="">Select Gender</option>' +
      '<option value="1">Male</option><option value="2">Female</option><option value="3">Others</option></select></div>' +
      '<div class="pr-field"><label for="StateID">State <span class="pr-req">*</span></label>' +
      '<select id="StateID" name="StateID" required>' +
      stateOpts +
      "</select></div>" +
      '<div class="pr-field"><label for="CityID">City <span class="pr-req">*</span></label>' +
      '<select id="CityID" name="CityID" required><option value="">Select City</option></select></div>' +
      '<div class="pr-field"><label for="Phoneno">Phone No <span class="pr-req">*</span></label>' +
      '<input id="Phoneno" name="Phoneno" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile number" maxlength="10" pattern="[0-9]{10}" required /></div>' +
      '<div class="pr-field"><label for="Email">Email <span class="pr-req">*</span></label>' +
      '<input id="Email" name="Email" type="email" placeholder="Enter your email" autocomplete="email" required /></div>' +
      '<div class="pr-field"><label for="CountryDisplay">Country <span class="pr-req">*</span></label>' +
      '<input id="CountryDisplay" name="CountryDisplay" type="text" value="India" readonly tabindex="-1" aria-readonly="true" /></div>' +
      (isIntern
        ? '<input type="hidden" name="Experience" value="0" />' +
          maritalField.replace('class="pr-field"', 'class="pr-field pr-field--full"')
        : '<div class="pr-pair pr-field--full">' +
          '<div class="pr-field"><label for="Experience">Experience <span class="pr-req">*</span></label>' +
          '<select id="Experience" name="Experience" required><option value="">Select Experience</option>' +
          '<option value="1">Fresher</option><option value="2">1-2 Years</option><option value="3">2-4 Years</option>' +
          '<option value="4">4-6 Years</option><option value="5">6-10 Years</option><option value="6">&gt; 10 Years</option></select></div>' +
          maritalField +
          "</div>") +
      '<div class="pr-field pr-field--full"><label for="AboutYourSelf">Explain About Yourself <span class="pr-req">*</span></label>' +
      '<textarea id="AboutYourSelf" name="AboutYourSelf" rows="4" maxlength="6000" placeholder="Explain about yourself" required></textarea>' +
      '<p class="pr-hint pr-char-limit">Max 6000 Characters</p></div>' +
      "</div></section>" +
      /* ADDRESS */ '<section class="pr-section" id="pr-address">' +
      sectionHead("02", "Address details") +
      '<div class="pr-grid">' +
      '<div class="pr-field"><label for="Address">Current address <span class="pr-req">*</span></label>' +
      '<input id="Address" name="Address" type="text" placeholder="Address line 1" required /></div>' +
      '<div class="pr-field"><label for="Address2">Address line 2</label>' +
      '<input id="Address2" name="Address2" type="text" placeholder="Address line 2 (optional)" /></div>' +
      '<div class="pr-field"><label for="CurrentStateID">State <span class="pr-req">*</span></label>' +
      '<select id="CurrentStateID" name="CurrentStateID" required>' +
      stateOpts +
      "</select></div>" +
      '<div class="pr-field"><label for="CurrentCityID">City <span class="pr-req">*</span></label>' +
      '<select id="CurrentCityID" name="CurrentCityID" required><option value="">Select City</option></select></div>' +
      '<div class="pr-field"><label for="CurrentPincode">Pincode <span class="pr-req">*</span></label>' +
      '<input id="CurrentPincode" name="CurrentPincode" type="text" inputmode="numeric" pattern="\\d{6}" placeholder="6-digit pincode" maxlength="6" required /></div>' +
      '<div class="pr-field pr-field--full pr-same">' +
      '<label><input type="checkbox" name="sameAsCurrent" id="sameAsCurrent" />Permanent address same as current</label></div>' +
      '<div class="pr-field"><label for="PermanentAddress">Permanent address <span class="pr-req">*</span></label>' +
      '<input id="PermanentAddress" name="PermanentAddress" type="text" placeholder="Address line 1" required /></div>' +
      '<div class="pr-field"><label for="PermanentAddress2">Address line 2</label>' +
      '<input id="PermanentAddress2" name="PermanentAddress2" type="text" placeholder="Address line 2 (optional)" /></div>' +
      '<div class="pr-field"><label for="PermanentStateID">State <span class="pr-req">*</span></label>' +
      '<select id="PermanentStateID" name="PermanentStateID" required>' +
      stateOpts +
      "</select></div>" +
      '<div class="pr-field"><label for="PermanentCityID">City <span class="pr-req">*</span></label>' +
      '<select id="PermanentCityID" name="PermanentCityID" required><option value="">Select City</option></select></div>' +
      '<div class="pr-field"><label for="PermanentPincode">Pincode <span class="pr-req">*</span></label>' +
      '<input id="PermanentPincode" name="PermanentPincode" type="text" inputmode="numeric" pattern="\\d{6}" placeholder="6-digit pincode" maxlength="6" required /></div>' +
      "</div></section>" +
      /* LANGUAGES */ '<section class="pr-section pr-section--languages" id="languages-known-section" aria-labelledby="pr-lang-title">' +
      '<div id="pr-languages" class="pr-languages">' +
      languagesSheetHtml() +
      "</div></section>" +
      /* Skill entry is always on this section so candidates can add skills even when the role has no presets. */ '<section class="pr-section" id="skills-section">' +
      sectionHead("04", "Skills") +
      knownSkillsMarkup() +
      '<div id="pr-skills" class="pr-skills">Loading skills...</div></section>' +
      /* PROFESSIONAL */ '<section class="pr-section">' +
      sectionHead("", "Professional Info") +
      '<div class="pr-grid">' +
      (isIntern
        ? '<div class="pr-field"><label for="ExpectedStipend">Expected stipend (per month) <span class="pr-req">*</span></label>' +
          '<input id="ExpectedStipend" name="ExpectedStipend" type="text" inputmode="numeric" placeholder="Enter expected stipend" />' +
          '<input type="hidden" name="ExpectedSalary" value="0" /><input type="hidden" name="CurrentSalary" value="" />' +
          '<input type="hidden" name="ReasonForQuit" value="" /></div>'
        : '<div class="pr-field"><label for="ExpectedSalary">Expected CTC (Per Annum) <span class="pr-req">*</span></label>' +
          '<input id="ExpectedSalary" name="ExpectedSalary" type="text" inputmode="numeric" placeholder="Enter expected salary" />' +
          '<input type="hidden" name="ExpectedStipend" value="" /></div>' +
          '<div id="pr-exp-extra" class="pr-field pr-field--full pr-grid-inner" hidden>' +
          '<div class="pr-field"><label for="CurrentSalary">Current CTC (Per Annum) <span class="pr-req">*</span></label>' +
          '<input id="CurrentSalary" name="CurrentSalary" type="text" inputmode="numeric" placeholder="Enter current salary" /></div>' +
          '<div class="pr-field pr-field--full"><label for="ReasonForQuit">Reason for Quitting Previous Job <span class="pr-req">*</span></label>' +
          '<textarea id="ReasonForQuit" name="ReasonForQuit" rows="3" placeholder="Reason for quitting previous job"></textarea></div></div>') +
      '<div class="pr-field"><label for="JoinPeriod">Joining Period <span class="pr-req">*</span></label>' +
      '<select id="JoinPeriod" name="JoinPeriod" required><option value="">Choose...</option>' +
      '<option value="Immediate">Immediate</option><option value="15 Days">15 Days</option>' +
      '<option value="30 Days">30 Days</option><option value="More than 30 Days">More than 30 Days</option></select></div>' +
      '<div class="pr-field"><label>Willingness to Relocate <span class="pr-req">*</span></label>' +
      '<div class="pr-radios pr-radios--row" id="relocateYes">' +
      '<label><input type="radio" name="ReadyToRelocate" value="Yes" />Yes</label>' +
      '<label><input type="radio" name="ReadyToRelocate" value="No" />No</label>' +
      '<label><input type="radio" name="ReadyToRelocate" value="Open" />Open</label></div></div>' +
      '<div class="pr-field"><label for="WorkModePreference">Work mode preference <span class="pr-req">*</span></label>' +
      '<select id="WorkModePreference" name="WorkModePreference" required><option value="">Choose...</option>' +
      '<option value="Office">Office</option><option value="Hybrid">Hybrid</option><option value="Remote">Remote</option></select></div>' +
      '<div class="pr-field"><label for="InterviewMode1">Mode of Interview <span class="pr-req">*</span></label>' +
      '<select id="InterviewMode1" name="InterviewMode1" required><option value="">Choose...</option>' +
      '<option value="Direct Walkin">Direct Walkin</option><option value="Virtual">Virtual</option><option value="Both">Both</option></select></div>' +
      '<div class="pr-field"><label for="HighestQualification">Highest Qualification <span class="pr-req">*</span></label>' +
      '<select id="HighestQualification" name="HighestQualification" required>' +
      '<option value="">Choose...</option>' +
      '<option value="10th Standard">10th Standard</option>' +
      '<option value="12th Standard">12th Standard</option>' +
      '<option value="Diploma">Diploma</option>' +
      '<option value="Under Graduate">Under Graduate</option>' +
      '<option value="Post Graduate">Post Graduate</option>' +
      '<option value="Doctorate">Doctorate</option></select></div>' +
      '<div class="pr-field"><label for="ExpectedDOJ">Expected date of joining</label>' +
      '<input id="ExpectedDOJ" name="ExpectedDOJ" type="date" /></div>' +
      "</div></section>" +
      /* UPLOADS */ '<section class="pr-section" id="upload-photo-resume-section">' +
      sectionHead("07", "Uploads") +
      '<div class="pr-grid">' +
      '<div class="pr-field"><label for="ProfilePhoto">Upload Your Photo <span class="pr-req">*</span></label>' +
      '<input id="ProfilePhoto" name="ProfilePhoto" type="file" accept="image/*" required />' +
      '<button type="button" class="pr-photo-edit" id="pr-photo-edit" hidden>Edit Photo</button>' +
      '<p id="pr-photo-msg" class="pr-hint" hidden></p>' +
      '<span class="pr-hint">JPG, PNG, GIF, or BMP. A single face is checked, then drag the crop box to choose the area.</span></div>' +
      '<div class="pr-field"><label for="ResumeFile">Upload Resume' +
      (isIntern ? "" : ' <span class="pr-req">*</span>') +
      "</label>" +
      '<input id="ResumeFile" name="ResumeFile" type="file" accept=".pdf,.doc,.docx,application/pdf"' +
      (isIntern ? "" : " required") +
      " />" +
      '<span class="pr-hint">PDF, DOC, or DOCX' +
      (isIntern ? " (optional for internships)" : "") +
      "</span></div>" +
      "</div></section>" +
      '<section class="pr-section pr-section--tab-nav">' +
      '<div class="pr-actions">' +
      '<button type="button" class="pr-btn pr-btn-ink" id="pr-next-education">Continue to Education</button>' +
      '<button type="button" class="pr-btn pr-btn-draft" id="pr-save-draft" data-pr-save-draft>Save draft</button>' +
      "</div></section></div>" +
      '<div class="pr-old-panel" data-pr-panel="education" hidden>' +
      '<section class="pr-section">' +
      sectionHead("", "Education &amp; Certifications") +
      '<p class="pr-edu-lead">Add your academic qualifications.</p>' +
      '<div class="academic-tags">' +
      '<button type="button" class="academic-tag active" data-edu-step="10th">10th Standard</button>' +
      '<button type="button" class="academic-tag" data-edu-step="12th">12th Standard</button>' +
      '<button type="button" class="academic-tag" data-edu-step="diploma">Diploma</button>' +
      '<button type="button" class="academic-tag" data-edu-step="ug">Under Graduate</button>' +
      '<button type="button" class="academic-tag" data-edu-step="pg">Post Graduate</button>' +
      '<button type="button" class="academic-tag" data-edu-step="phd">Doctorate</button>' +
      "</div>" +
      '<div class="education-form-inline-container" data-edu-form="10th">' +
      "<h5>10th Standard</h5><div class=\"pr-grid\">" +
      '<div class="pr-field"><label for="sslcInstitute">School Name <span class="pr-req">*</span></label><input id="sslcInstitute" name="sslcInstitute" type="text" placeholder="Enter school name" /></div>' +
      '<div class="pr-field"><label for="sslcBoard">Board Type <span class="pr-req">*</span></label>' + boardSelect("sslcBoard") + "</div>" +
      '<div class="pr-field"><label for="sslcYear">Year Passed <span class="pr-req">*</span></label><select id="sslcYear" name="sslcYear">' + years + "</select></div>" +
      '<div class="pr-field"><label for="sslcPercentage">Percentage <span class="pr-req">*</span></label><input id="sslcPercentage" name="sslcPercentage" type="text" placeholder="XX.XX" /></div>' +
      '<div class="pr-field"><label for="sslcAttempts">Attempts</label><select id="sslcAttempts" name="sslcAttempts">' + attemptOpts + "</select></div>" +
      "</div></div>" +
      '<div class="education-form-inline-container" data-edu-form="12th" hidden>' +
      "<h5>12th Standard</h5><div class=\"pr-grid\">" +
      '<div class="pr-field"><label for="hscInstitute">School Name <span class="pr-req">*</span></label><input id="hscInstitute" name="hscInstitute" type="text" placeholder="Enter school name" /></div>' +
      '<div class="pr-field"><label for="hscBoard">Board Type <span class="pr-req">*</span></label>' + boardSelect("hscBoard") + "</div>" +
      '<div class="pr-field"><label for="hscYear">Year Passed <span class="pr-req">*</span></label><select id="hscYear" name="hscYear">' + years + "</select></div>" +
      '<div class="pr-field"><label for="hscPercentage">Percentage <span class="pr-req">*</span></label><input id="hscPercentage" name="hscPercentage" type="text" placeholder="XX.XX" /></div>' +
      '<div class="pr-field"><label for="hscAttempts">Attempts</label><select id="hscAttempts" name="hscAttempts">' + attemptOpts + "</select></div>" +
      "</div></div>" +
      '<div class="education-form-inline-container" data-edu-form="diploma" hidden>' +
      "<h5>Diploma Course</h5><div class=\"pr-grid\">" +
      '<div class="pr-field"><label for="diploma1Degree">Course Name <span class="pr-req">*</span></label><input id="diploma1Degree" name="diploma1Degree" type="text" placeholder="Enter course name" /></div>' +
      '<div class="pr-field"><label for="diploma1Spec">Specialization <span class="pr-req">*</span></label><input id="diploma1Spec" name="diploma1Spec" type="text" placeholder="e.g., Computer Science" /></div>' +
      '<div class="pr-field"><label for="diploma1Type">Type <span class="pr-req">*</span></label>' + typeSelect("diploma1Type", "diploma") + "</div>" +
      '<div class="pr-field"><label for="diploma1YearStart">Year Start <span class="pr-req">*</span></label><select id="diploma1YearStart" name="diploma1YearStart">' + years + "</select></div>" +
      '<div class="pr-field"><label for="diploma1YearEnd">Year Passed <span class="pr-req">*</span></label><select id="diploma1YearEnd" name="diploma1YearEnd">' + years + "</select></div>" +
      '<div class="pr-field"><label for="diploma1Percentage">Percentage <span class="pr-req">*</span></label><input id="diploma1Percentage" name="diploma1Percentage" type="text" placeholder="XX.XX" /></div>' +
      '<div class="pr-field"><label for="diploma1Arrears">Pending Arrears</label><select id="diploma1Arrears" name="diploma1Arrears">' + arrearOpts + "</select></div>" +
      "</div></div>" +
      '<div class="education-form-inline-container" data-edu-form="ug" hidden>' +
      "<h5>Under Graduate Degree</h5><div class=\"pr-grid\">" +
      '<div class="pr-field"><label for="ugDegree">Degree <span class="pr-req">*</span></label><select id="ugDegree" name="ugDegree">' + degreeOpts(UG_DEGREES) + "</select></div>" +
      '<div class="pr-field"><label for="ugSpec">Specialization <span class="pr-req">*</span></label><input id="ugSpec" name="ugSpec" type="text" placeholder="e.g., Computer Science" /></div>' +
      '<div class="pr-field"><label for="ugType">Type <span class="pr-req">*</span></label>' + typeSelect("ugType", "ug") + "</div>" +
      '<div class="pr-field"><label for="ugYearStart">Year Start <span class="pr-req">*</span></label><select id="ugYearStart" name="ugYearStart">' + years + "</select></div>" +
      '<div class="pr-field"><label for="ugYearEnd">Year Passed <span class="pr-req">*</span></label><select id="ugYearEnd" name="ugYearEnd">' + years + "</select></div>" +
      '<div class="pr-field"><label for="ugPercentage">Percentage <span class="pr-req">*</span></label><input id="ugPercentage" name="ugPercentage" type="text" placeholder="XX.XX" /></div>' +
      '<div class="pr-field"><label for="ugArrears">Pending Arrears</label><select id="ugArrears" name="ugArrears">' + arrearOpts + "</select></div>" +
      "</div></div>" +
      '<div class="education-form-inline-container" data-edu-form="pg" hidden>' +
      "<h5>Post Graduate Degree</h5><div class=\"pr-grid\">" +
      '<div class="pr-field"><label for="pgDegree">Degree <span class="pr-req">*</span></label><select id="pgDegree" name="pgDegree">' + degreeOpts(PG_DEGREES) + "</select></div>" +
      '<div class="pr-field"><label for="pgSpec">Specialization <span class="pr-req">*</span></label><input id="pgSpec" name="pgSpec" type="text" placeholder="e.g., Marketing" /></div>' +
      '<div class="pr-field"><label for="pgType">Type <span class="pr-req">*</span></label>' + typeSelect("pgType", "pg") + "</div>" +
      '<div class="pr-field"><label for="pgYearStart">Year Start <span class="pr-req">*</span></label><select id="pgYearStart" name="pgYearStart">' + years + "</select></div>" +
      '<div class="pr-field"><label for="pgYearEnd">Year Passed <span class="pr-req">*</span></label><select id="pgYearEnd" name="pgYearEnd">' + years + "</select></div>" +
      '<input type="hidden" id="pgYearPassed" name="pgYearPassed" value="" />' +
      '<div class="pr-field"><label for="pgPercentage">Percentage <span class="pr-req">*</span></label><input id="pgPercentage" name="pgPercentage" type="text" placeholder="XX.XX" /></div>' +
      '<div class="pr-field"><label for="pgArrears">Pending Arrears</label><select id="pgArrears" name="pgArrears">' + arrearOpts + "</select></div>" +
      "</div></div>" +
      '<div class="education-form-inline-container" data-edu-form="phd" hidden>' +
      "<h5>Doctorate / Post Doctorate</h5><div class=\"pr-grid\">" +
      '<div class="pr-field"><label for="phdDegree">Degree <span class="pr-req">*</span></label><select id="phdDegree" name="phdDegree">' + degreeOpts(PHD_DEGREES) + "</select></div>" +
      '<div class="pr-field"><label for="phdSpec">Specialization <span class="pr-req">*</span></label><input id="phdSpec" name="phdSpec" type="text" placeholder="e.g., Artificial Intelligence" /></div>' +
      '<div class="pr-field"><label for="phdType">Type <span class="pr-req">*</span></label>' + typeSelect("phdType", "phd") + "</div>" +
      '<div class="pr-field"><label for="phdYearStart">Year Start <span class="pr-req">*</span></label><select id="phdYearStart" name="phdYearStart">' + years + "</select></div>" +
      '<div class="pr-field"><label for="phdYearEnd">Year Passed <span class="pr-req">*</span></label><select id="phdYearEnd" name="phdYearEnd">' + years + "</select></div>" +
      '<div class="pr-field"><label for="phdPercentage">Percentage <span class="pr-req">*</span></label><input id="phdPercentage" name="phdPercentage" type="text" placeholder="XX.XX" /></div>' +
      '<div class="pr-field"><label for="phdArrears">Pending Arrears</label><select id="phdArrears" name="phdArrears">' + arrearOpts + "</select></div>" +
      "</div></div>" +
      '<div class="pr-cert-block">' +
      '<div class="pr-cert-head"><h5>Add Certifications</h5><button type="button" class="skill-add-button" id="cert-add">Add</button></div>' +
      '<div id="cert-rows"></div></div>' +
      '<div class="pr-intro">' +
      '<h5>Self Introduction</h5>' +
      '<p class="pr-edu-lead">Tell us about yourself and your professional journey.</p>' +
      '<div class="pr-field"><label for="IntroVideoLink">Video (Paste YouTube link only)</label>' +
      '<input id="IntroVideoLink" name="IntroVideoLink" type="url" placeholder="https://www.youtube.com/watch?v=..." />' +
      '<small id="yt-error" class="pr-yt-error" hidden>Please enter a valid YouTube link.</small></div>' +
      '<div class="pr-field"><label>Audio (Max 2 minutes)</label>' +
      '<div class="audio-recorder" id="pr-recorder">' +
      '<button type="button" class="recorder-btn" id="rec-start">Record</button>' +
      '<button type="button" class="recorder-btn" id="rec-stop" hidden>Stop</button>' +
      '<span id="rec-time" class="rec-time" hidden>0:00</span>' +
      '<audio id="rec-preview" controls hidden></audio>' +
      '<button type="button" class="recorder-btn" id="rec-again" hidden>Re-record</button>' +
      "</div></div></div>" +
      "</section>" +
      /* SUBMIT - Education tab only (matches old Angular end-of-form flow) */ '<section class="pr-section pr-section--submit">' +
      '<p class="pr-declare-copy">By sharing the above details, I hereby declare that the information provided is true and correct to the best of my knowledge. I understand that any false or misleading information may lead to rejection or termination at any stage. I also consent to the use of my personal data for recruitment purposes.</p>' +
      '<label class="pr-declare" for="isDeclared">' +
      '<input type="checkbox" name="isDeclared" id="isDeclared" required aria-required="true" />' +
      "<span>I hereby Declare &amp; Consent <span class=\"pr-req\">*</span></span></label>" +
      '<div class="pr-actions">' +
      '<button type="submit" class="pr-btn pr-btn-ink" id="pr-submit">Submit Application</button>' +
      '<button type="button" class="pr-btn pr-btn-draft" id="pr-save-draft-edu" data-pr-save-draft>Save draft</button>' +
      '<a class="pr-btn pr-btn-panel" href="' +
      escapeHtml(backToRoleHref(job)) +
      '">Back to role</a>' +
      "</div>" +
      "</section></div>" +
      '<div id="pr-photo-editor" class="pr-editor" hidden>' +
      '<div class="pr-editor-card" role="dialog" aria-modal="true" aria-label="Edit Photo">' +
      '<div class="pr-editor-head"><strong>Edit Photo</strong><button type="button" id="pr-photo-close" aria-label="Close">&times;</button></div>' +
      '<div class="pr-crop-stage"><img id="pr-photo-img" alt="Photo to crop" /></div>' +
      '<div class="pr-editor-actions"><button type="button" id="pr-photo-rotate">Rotate</button><button type="button" id="pr-photo-save">Save</button></div>' +
      '<p class="pr-hint">Drag and resize the crop box (any shape), rotate if needed, then save.</p>' +
      "</div></div>" +
      "</form>"
    );
  }

  function backToRoleHref(job) {
    var q = new URLSearchParams();
    q.set("id", String(job.jobid));
    if (job.companyId) q.set("companyId", String(job.companyId));
    var qs = q.toString();
    return "Careerdetails.html?" + qs + "#" + qs;
  }

  function mapHrpopsJob(raw, fallbackId, companyId) {
    if (!raw) return null;
    var cat = String(
      raw.category_name || raw.categoryName || raw.CategoryName || ""
    ).toLowerCase();
    var intern = cat.indexOf("intern") >= 0;
    var cid = raw.companyId || companyId || DEFAULT_COMPANY_ID;
    if (cid != null && Number(cid) === 0) cid = companyId || DEFAULT_COMPANY_ID;
    return {
      jobid: raw.job_code || raw.jobPostId || fallbackId,
      post: raw.title || raw.post,
      experience: raw.experience,
      location: raw.location,
      responsibilities: raw.responsibilities,
      musthave: raw.musthave || raw.mustHave || raw.requirements,
      expireDate: raw.expireDate || raw.expire_date,
      validationType: intern ? "I" : "J",
      companyId: cid || DEFAULT_COMPANY_ID,
      skillSets: Array.isArray(raw.skillSets) ? raw.skillSets : [],
      source: "hrpops",
    };
  }

  async function resolveJobFromHrpops(jobId) {
    var hrpops = window.NH_HRPOPS_CAREERS;
    if (!hrpops || typeof hrpops.fetchJobDetail !== "function") return null;
    var cfg = typeof hrpops.config === "function" ? hrpops.config() : {};
    var companyId =
      getCompanyId() || (cfg && cfg.companyId) || DEFAULT_COMPANY_ID;
    if (companyId) {
      try {
        var detail = await hrpops.fetchJobDetail(companyId, jobId);
        var mapped = mapHrpopsJob(detail, jobId, companyId);
        if (mapped) return mapped;
      } catch (_err) {
        /* try list match */
      }
    }
    try {
      var listed = await hrpops.fetchJobs();
      var match = (listed.jobs || []).find(function (j) {
        return String(j.jobPostId) === String(jobId) || String(j.job_code) === String(jobId);
      });
      if (match) {
        return mapHrpopsJob(match, jobId, match.companyId || companyId);
      }
    } catch (_err2) {
      /* fall through */
    }
    return null;
  }

  async function resolveJob(jobId) {
    if (!jobId) return null;
    /* HRPops jobPostId only. DojoMan CarrerIDs are a different id space. */
    return resolveJobFromHrpops(jobId);
  }

  async function mount() {
    var id = getId();
    var job = await resolveJob(id);

    if (!job) {
      renderNotFound(
        id,
        id
          ? "Open roles on the Careers page use HRPops job codes (company " +
              DEFAULT_COMPANY_ID +
              ")."
          : ""
      );
      return;
    }

    var isIntern = String(job.validationType || "").toUpperCase() === "I";
    var title = qs("#pr-title");
    var meta = qs("#pr-meta");
    var main = qs("#pr-main");
    var post = job.post || "Open role";

    document.title = "Apply - " + post + " | Nohitatu";
    var desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Apply for " + post + " (job code " + job.jobid + ") at Nohitatu."
      );
    }

    if (title) title.textContent = post;
    if (meta) {
      meta.hidden = false;
      meta.innerHTML =
        '<li><span class="pr-meta-label">Job code</span><span class="pr-meta-value pr-code">' +
        escapeHtml(String(job.jobid)) +
        "</span></li>" +
        '<li><span class="pr-meta-label">Experience</span><span class="pr-meta-value">' +
        escapeHtml(job.experience || "-") +
        "</span></li>" +
        '<li><span class="pr-meta-label">Location</span><span class="pr-meta-value">' +
        escapeHtml(job.location || "-") +
        "</span></li>";
    }

    if (!main) return;
    if (!job.companyId) job.companyId = resolveCompanyId(job);
    locationSource = "hrpops";
    main.innerHTML = buildFormMarkup(job, isIntern);

    var form = qs("#pr-form");
    revealForm(form);
    wireSameAsCurrent(form);
    wirePhoneDigits(form);
    wireLanguageSection(qs("#pr-languages"));
    wireOldForm(form);
    await fillHrpopsStates(form);

    form.elements.namedItem("StateID").addEventListener("change", function (e) {
      loadCities(e.target.value, form.elements.namedItem("CityID"));
    });
    form.elements
      .namedItem("CurrentStateID")
      .addEventListener("change", function (e) {
        loadCities(e.target.value, form.elements.namedItem("CurrentCityID"));
      });
    form.elements
      .namedItem("PermanentStateID")
      .addEventListener("change", function (e) {
        loadCities(e.target.value, form.elements.namedItem("PermanentCityID"));
      });

    if (!isIntern) {
      form.elements.namedItem("Experience").addEventListener("change", function () {
        onExperienceChange(form);
      });
    }

    var skillsEl = qs("#pr-skills");
    var presetSkills = Array.isArray(job.skillSets) ? job.skillSets : null;
    await loadSkills(job.jobid, skillsEl, isIntern, presetSkills);
    ensureKnownSkillsUi(form);
    await wireDraft(form, job, isIntern);

    form.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      var skillPack = collectSkills(qs("#pr-skills"), isIntern);
      var languages = collectLanguages(qs("#pr-languages"));
      if (!validate(form, isIntern, skillPack, languages)) return;

      var companyId = resolveCompanyId(job);
      var fd = buildHrpopsFormData(
        form,
        job,
        isIntern,
        skillPack.list,
        languages
      );
      var btn = qs("#pr-submit");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Submitting...";
      }
      setStatus("Sending application...", "info");

      try {
        var res = await fetch(hrpopsApplyUrl(companyId), {
          method: "POST",
          body: fd,
          credentials: "omit"
        });
        var text = await res.text();
        var data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = text && text.length < 400 ? { message: text } : null;
        }

        var result = "fail";
        var okFlag =
          data && (data.status === true || data.Status === true);
        if (res.ok && okFlag) {
          result = handleHrpopsSuccess(data);
        } else if (res.ok && data && !okFlag && (data.message || data.Message)) {
          setStatus(statusFromFailure(data, res.status), "error");
        } else if (res.ok) {
          setStatus(
            "Application sent. You may receive a confirmation by email.",
            "ok"
          );
          result = "ok";
        } else {
          setStatus(statusFromFailure(data, res.status), "error");
        }

        if (result === "ok") {
          clearDraft(job);
          form.reset();
          knownSkills = [];
          introAudioFile = null;
          editedPhotoFile = null;
          photoDataUrl = "";
          destroyPhotoCropper();
          var photoEdit = document.getElementById("pr-photo-edit");
          if (photoEdit) photoEdit.hidden = true;
          setPhotoMsg("", "");
          renderKnownSkills(form);
          var certRows = qs("#cert-rows", form);
          if (certRows) certRows.innerHTML = "";
          var langBox = qs("#pr-languages");
          if (langBox) {
            langUid = 1;
            knownLanguages = [];
            resetLanguageEntry(langBox);
            renderKnownLanguages(langBox);
            setLangMsg(langBox, "");
          }
          await fillHrpopsStates(form);
          if (skillsEl) await loadSkills(job.jobid, skillsEl, isIntern, presetSkills);
        }
      } catch (err) {
        console.error(err);
        setStatus(
          "Could not reach the application server" +
            (err && err.message ? " (" + err.message + ")" : "") +
            ". Email hrd@nohitatu.com with job code " +
            job.jobid +
            " if this continues.",
          "error"
        );
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Submit Application";
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
