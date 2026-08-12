/**
 * Local PostResume form — field names & multipart POST match live Angular app
 * action: https://career.dojoman.com/api/CarrerPosts/ResumePost
 * Requires window.NOHITATU_CAREER_DETAILS (js/career-details.js).
 */
(function () {
  "use strict";

  var API = "https://career.dojoman.com/api/";
  var RESUME_POST = API + "CarrerPosts/ResumePost";
  var CITY_API = API + "StateAndCity/GetCity/";
  var SKILL_API = API + "CarrerPosts/GetCareerSkillset?id=";
  var RATING_API = API + "CarrerPosts/GetRating";
  var COUNTRY_ID = "4";

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

  var langUid = 1;

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function getId() {
    return (new URLSearchParams(window.location.search).get("id") || "").trim();
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

  function emailOk(v) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
  }

  function digitsOnly(v) {
    return String(v || "").replace(/[\s\-()]/g, "");
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

  function joinAddress(line1, line2) {
    var a = (line1 || "").trim();
    var b = (line2 || "").trim();
    return b ? a + "-" + b : a;
  }

  async function loadCities(stateId, targetSelect) {
    fillSelect(targetSelect, '<option value="">Select City</option>');
    if (!stateId) return;
    try {
      var res = await fetch(CITY_API + stateId);
      var data = await res.json();
      if (!Array.isArray(data)) return;
      var opts = '<option value="">Select City</option>';
      data.forEach(function (c) {
        opts +=
          '<option value="' +
          escapeHtml(String(c.cityId)) +
          '">' +
          escapeHtml(String(c.cityName || "").trim()) +
          "</option>";
      });
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

  async function loadSkills(jobId, container, isIntern) {
    if (!container) return [];
    container.innerHTML = "";
    try {
      var res = await fetch(SKILL_API + jobId);
      var data = await res.json();
      if (!Array.isArray(data) || !data.length) {
        container.innerHTML =
          '<p class="pr-hint">No job-specific skills for this role. You can still apply.</p>';
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
        html +=
          '<div class="pr-skill-row" data-skill-id="' +
          escapeHtml(String(id)) +
          '">' +
          '<div class="pr-skill-name">' +
          escapeHtml(String(sk.skill || "").trim()) +
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
            '<div class="pr-field pr-field--half">' +
            "<label>Experience <span class=\"pr-req\">*</span></label>" +
            '<div class="pr-inline">' +
            '<select class="pr-skill-year" id="year_' +
            id +
            '" data-skill="' +
            id +
            '">' +
            optionList(years, "value", "names", "Choose Year") +
            "</select>" +
            '<select class="pr-skill-month" id="month_' +
            id +
            '" data-skill="' +
            id +
            '">' +
            optionList(months, "value", "names", "Choose Month") +
            "</select></div></div>";
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
        '<p class="pr-hint">Could not load skills. You can still submit the rest of the application.</p>';
      return [];
    }
  }

  function collectSkills(container, isIntern) {
    var rows = qsa(".pr-skill-row", container);
    var list = [];
    var missing = false;
    rows.forEach(function (row) {
      var id = parseInt(row.getAttribute("data-skill-id"), 10);
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
        rating: parseInt(r, 10),
        year: parseInt(y, 10) || 0,
        month: parseInt(m, 10) || 0
      });
    });
    return { list: list, missing: missing && rows.length > 0 };
  }

  function languageRowHtml(uid, isFirst) {
    var langOpts = optionList(LANG_OPTIONS, null, null, "Select Language");
    var levelOpts = optionList(LANG_LEVELS, null, null, "Select");
    return (
      '<div class="pr-lang-row" data-lang-uid="' +
      uid +
      '">' +
      '<div class="pr-field"><label for="langName' +
      uid +
      '">Language <span class="pr-req">*</span></label>' +
      '<select id="langName' +
      uid +
      '" class="pr-lang-name" data-lang="' +
      uid +
      '">' +
      langOpts +
      "</select></div>" +
      '<div class="pr-field"><label for="langRead' +
      uid +
      '">Read <span class="pr-req">*</span></label>' +
      '<select id="langRead' +
      uid +
      '" class="pr-lang-read" data-lang="' +
      uid +
      '">' +
      levelOpts +
      "</select></div>" +
      '<div class="pr-field"><label for="langWrite' +
      uid +
      '">Write <span class="pr-req">*</span></label>' +
      '<select id="langWrite' +
      uid +
      '" class="pr-lang-write" data-lang="' +
      uid +
      '">' +
      levelOpts +
      "</select></div>" +
      '<div class="pr-field"><label for="langSpeak' +
      uid +
      '">Speak <span class="pr-req">*</span></label>' +
      '<select id="langSpeak' +
      uid +
      '" class="pr-lang-speak" data-lang="' +
      uid +
      '">' +
      levelOpts +
      "</select></div>" +
      '<div class="pr-field"><label>Mother tongue</label>' +
      '<div class="pr-radios">' +
      '<label><input type="radio" name="langMother' +
      uid +
      '" value="Yes"' +
      (isFirst ? " checked" : "") +
      " /> Yes</label>" +
      '<label><input type="radio" name="langMother' +
      uid +
      '" value="No"' +
      (isFirst ? "" : " checked") +
      " /> No</label></div></div>" +
      '<div class="pr-lang-actions">' +
      '<button type="button" class="pr-btn pr-btn-panel pr-lang-add" data-lang="' +
      uid +
      '">Add</button>' +
      (isFirst
        ? ""
        : '<button type="button" class="pr-btn pr-btn-ghost pr-lang-remove" data-lang="' +
          uid +
          '" aria-label="Remove language">Remove</button>') +
      "</div></div>"
    );
  }

  function wireLanguageSection(container) {
    if (!container) return;
    container.addEventListener("click", function (ev) {
      var addBtn = ev.target.closest(".pr-lang-add");
      var remBtn = ev.target.closest(".pr-lang-remove");
      if (addBtn) {
        langUid += 1;
        var wrap = document.createElement("div");
        wrap.innerHTML = languageRowHtml(langUid, false);
        container.appendChild(wrap.firstChild);
        return;
      }
      if (remBtn) {
        var row = remBtn.closest(".pr-lang-row");
        if (row && qsa(".pr-lang-row", container).length > 1) row.remove();
      }
    });
  }

  function collectLanguages(container) {
    var rows = qsa(".pr-lang-row", container);
    var list = [];
    rows.forEach(function (row) {
      var uid = row.getAttribute("data-lang-uid");
      var name = (row.querySelector(".pr-lang-name") || {}).value || "";
      var read = (row.querySelector(".pr-lang-read") || {}).value || "";
      var write = (row.querySelector(".pr-lang-write") || {}).value || "";
      var speak = (row.querySelector(".pr-lang-speak") || {}).value || "";
      var motherEl = row.querySelector(
        'input[name="langMother' + uid + '"]:checked'
      );
      var motherTongue = motherEl ? motherEl.value : "No";
      if (name && read && write && speak) {
        list.push({
          name: name,
          read: read,
          write: write,
          speak: speak,
          motherTongue: motherTongue || "No"
        });
      }
    });
    return list;
  }

  function validate(form, isIntern, skillPack, langList) {
    var name = fieldValue(form, "Name");
    if (!name) return fail(form, "Name is required", "Name");
    if (name.length < 3) {
      return fail(form, "Name should contain atleast 3 characters", "Name");
    }
    if (!fieldValue(form, "Dob")) {
      return fail(form, "Date of birth is required", "Dob");
    }
    if (!fieldValue(form, "Gender")) {
      return fail(form, "Gender is required", "Gender");
    }
    if (!fieldValue(form, "StateID")) {
      return fail(form, "State is required", "StateID");
    }
    if (!fieldValue(form, "CityID")) {
      return fail(form, "City is required", "CityID");
    }

    var phone = digitsOnly(fieldValue(form, "Phoneno"));
    if (!phone) return fail(form, "Phone no. is required", "Phoneno");
    if (phone.length < 10) return fail(form, "Invalid Phone no.", "Phoneno");

    var email = fieldValue(form, "Email");
    if (!email) return fail(form, "Email is required", "Email");
    if (!emailOk(email)) return fail(form, "Invalid email", "Email");

    if (!isIntern && !fieldValue(form, "Experience")) {
      return fail(form, "Experience is required", "Experience");
    }
    if (!fieldValue(form, "AboutYourSelf")) {
      return fail(form, "Explain about yourself is required", "AboutYourSelf");
    }
    if (
      !isIntern &&
      fieldValue(form, "Experience") !== "1" &&
      !fieldValue(form, "ReasonForQuit")
    ) {
      return fail(
        form,
        "Reason for quiting previous job is required",
        "ReasonForQuit"
      );
    }

    if (!fieldValue(form, "Address")) {
      return fail(form, "Current Address is required", "Address");
    }
    if (!fieldValue(form, "CurrentStateID")) {
      return fail(form, "Current Address State is required", "CurrentStateID");
    }
    if (!fieldValue(form, "CurrentCityID")) {
      return fail(form, "Current Address City is required", "CurrentCityID");
    }
    var pin = fieldValue(form, "CurrentPincode");
    if (!pin || pin.length < 6) {
      return fail(
        form,
        "Current Address Pincode is required (6 digits)",
        "CurrentPincode"
      );
    }

    if (!fieldValue(form, "PermanentAddress")) {
      return fail(form, "Permanent Address is required", "PermanentAddress");
    }
    if (!fieldValue(form, "PermanentStateID")) {
      return fail(
        form,
        "Permanent Address State is required",
        "PermanentStateID"
      );
    }
    if (!fieldValue(form, "PermanentCityID")) {
      return fail(
        form,
        "Permanent Address City is required",
        "PermanentCityID"
      );
    }
    var ppin = fieldValue(form, "PermanentPincode");
    if (!ppin || ppin.length < 6) {
      return fail(
        form,
        "Permanent Address Pincode is required (6 digits)",
        "PermanentPincode"
      );
    }

    if (
      !isIntern &&
      fieldValue(form, "Experience") !== "1" &&
      !fieldValue(form, "CurrentSalary")
    ) {
      return fail(form, "Current CTC is required", "CurrentSalary");
    }

    if (!fieldValue(form, "HighestQualification")) {
      return fail(
        form,
        "Highest Qualification is required",
        "HighestQualification"
      );
    }

    if (!isIntern) {
      var expSal = fieldValue(form, "ExpectedSalary");
      if (!expSal) return fail(form, "Expected salary is required", "ExpectedSalary");
      if (expSal.length < 5) {
        return fail(
          form,
          "Enter at-least 5 digits in expected salary",
          "ExpectedSalary"
        );
      }
    } else {
      var stip = fieldValue(form, "ExpectedStipend");
      if (!stip) {
        return fail(form, "Expected stipend is required", "ExpectedStipend");
      }
      if (stip.length < 4) {
        return fail(
          form,
          "Enter at-least 4 digits in expected stipend",
          "ExpectedStipend"
        );
      }
    }

    if (!fieldValue(form, "JoinPeriod")) {
      return fail(form, "Joining period is required", "JoinPeriod");
    }
    if (!fieldValue(form, "ReadyToRelocate")) {
      return fail(form, "Willingness to Relocate is required", "ReadyToRelocate");
    }

    var photo = form.elements.namedItem("ProfilePhoto");
    if (!photo || !photo.files || !photo.files[0]) {
      return fail(
        form,
        "Photo is required — please upload your photo to submit.",
        "ProfilePhoto"
      );
    }

    var resume = form.elements.namedItem("ResumeFile");
    if (!isIntern && (!resume || !resume.files || !resume.files[0])) {
      return fail(
        form,
        "Resume is required — please upload your resume to submit.",
        "ResumeFile"
      );
    }
    if (resume && resume.files && resume.files[0]) {
      var rName = resume.files[0].name.toLowerCase();
      if (!/\.(pdf|doc|docx)$/.test(rName)) {
        return fail(form, "Resume must be PDF, DOC, or DOCX", "ResumeFile");
      }
    }

    if (skillPack && skillPack.missing) {
      return fail(
        form,
        "Please fill the Skill section. Please fill in all skill ratings and experience.",
        qs("#pr-skills")
      );
    }

    if (!fieldValue(form, "InterviewMode1")) {
      return fail(form, "Mode of Interview is required", "InterviewMode1");
    }

    if (!langList || !langList.length) {
      return fail(
        form,
        "Please add at least one Language with all fields (Language, Read, Write, Speak) filled",
        qs("#pr-languages")
      );
    }
    var hasMother = langList.some(function (l) {
      return l.motherTongue === "Yes" && l.name;
    });
    if (!hasMother) {
      return fail(form, "Mother tongue is mandatory", qs("#pr-languages"));
    }

    if (!fieldValue(form, "WorkModePreference")) {
      return fail(form, "Work Mode Preference is required", "WorkModePreference");
    }

    if (!fieldValue(form, "MaritalStatus")) {
      return fail(form, "Marital status is required", "MaritalStatus");
    }

    if (!form.elements.namedItem("isDeclared").checked) {
      return fail(form, "Please accept the declaration to proceed", "isDeclared");
    }

    return true;
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
    var joinPeriod = isIntern ? "0" : fieldValue(form, "JoinPeriod");
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
    fd.append("ExpectedDOJ", fieldValue(form, "ExpectedDOJ"));
    fd.append("LanguagesKnown", JSON.stringify(languages));
    fd.append("MaritalStatus", fieldValue(form, "MaritalStatus"));
    fd.append("HighestQualification", fieldValue(form, "HighestQualification"));
    fd.append("JoinPeriod", joinPeriod);
    fd.append("SkillList", JSON.stringify(skillList || []));

    var photo = form.elements.namedItem("ProfilePhoto").files[0];
    fd.append("ProfilePhoto", photo, photo.name);

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
    fd.append("pgDegree", fieldValue(form, "pgDegree") || "");
    fd.append("pgSpec", fieldValue(form, "pgSpec") || "");
    fd.append("pgType", fieldValue(form, "pgType") || "");
    fd.append("pgYearPassed", fieldValue(form, "pgYearPassed") || "");
    fd.append(
      "pgArrears",
      arrearsToApiValue(fieldValue(form, "pgArrears") || "No Arrear")
    );
    fd.append("pgYearStart", fieldValue(form, "pgYearStart") || "");
    fd.append("pgYearEnd", fieldValue(form, "pgYearEnd") || "");
    fd.append("pgPercentage", fieldValue(form, "pgPercentage") || "");

    var intro = form.elements.namedItem("IntroAudio");
    if (intro && intro.files && intro.files[0]) {
      fd.append("IntroAudio", intro.files[0], intro.files[0].name);
    }

    var resume = form.elements.namedItem("ResumeFile");
    if (resume && resume.files && resume.files[0]) {
      fd.append("ResumeFile", resume.files[0], resume.files[0].name);
    }

    return fd;
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
            : "Application submitted — " + reason
          : "Application submitted successfully.",
        "ok"
      );
      return "ok";
    }
    if (String(msg).toLowerCase() === "fail") {
      setStatus("Something went wrong! Please try again later.", "error");
      return "fail";
    }
    setStatus(
      reason || msg || "Something went wrong. Please try again later.",
      "error"
    );
    return "fail";
  }

  function renderNotFound(id) {
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
            "</strong> is not in our current openings, or the link may be outdated."
          : "No job code was provided in the URL.") +
        "</p>" +
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
      '<span class="pr-section-kicker" aria-hidden="true">' +
      escapeHtml(num) +
      " · </span>" +
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

  function onExperienceChange(form) {
    var exp = fieldValue(form, "Experience");
    var expBlock = qs("#pr-exp-extra");
    if (expBlock) expBlock.hidden = exp === "1" || exp === "";
  }

  function buildFormMarkup(job, isIntern) {
    var stateOpts = optionList(STATES, "stateId", "stateName", "Select State");
    var years = yearOptions(1950, new Date().getFullYear(), "Select Year");
    var attemptOpts = attemptOptsHtml();
    var arrearOpts = arrearOptsHtml();
    langUid = 1;

    return (
      '<form id="pr-form" class="pr-form" novalidate>' +
      '<input type="hidden" name="CarrerID" value="' +
      escapeHtml(String(job.jobid)) +
      '" />' +
      '<input type="hidden" name="CountryID" value="' +
      COUNTRY_ID +
      '" />' +
      '<p class="pr-lead">For a better chance of success, complete your profile. Fields marked <span class="pr-req">*</span> are required.</p>' +
      '<div id="pr-status" class="pr-status" hidden role="status"></div>' +
      /* PERSONAL */ '<section class="pr-section" id="pr-personal">' +
      sectionHead("01", "Personal details") +
      '<div class="pr-grid">' +
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
      '<input id="Phoneno" name="Phoneno" type="tel" inputmode="numeric" placeholder="Enter your phone number" required /></div>' +
      '<div class="pr-field"><label for="Email">Email <span class="pr-req">*</span></label>' +
      '<input id="Email" name="Email" type="email" placeholder="Enter your email" autocomplete="email" required /></div>' +
      (isIntern
        ? '<input type="hidden" name="Experience" value="0" />'
        : '<div class="pr-field"><label for="Experience">Experience <span class="pr-req">*</span></label>' +
          '<select id="Experience" name="Experience" required><option value="">Select Experience</option>' +
          '<option value="1">Fresher</option><option value="2">1-2 Years</option><option value="3">2-4 Years</option>' +
          '<option value="4">4-6 Years</option><option value="5">6-10 Years</option><option value="6">&gt; 10 Years</option></select></div>') +
      '<div class="pr-field"><label for="MaritalStatus">Marital Status <span class="pr-req">*</span></label>' +
      '<div class="pr-radios" role="radiogroup" id="MaritalStatus">' +
      '<label><input type="radio" name="MaritalStatus" value="Single" /> Single</label>' +
      '<label><input type="radio" name="MaritalStatus" value="Married" /> Married</label></div></div>' +
      '<div class="pr-field pr-field--full"><label for="AboutYourSelf">About yourself <span class="pr-req">*</span></label>' +
      '<textarea id="AboutYourSelf" name="AboutYourSelf" rows="4" placeholder="Explain about yourself" required></textarea></div>' +
      "</div></section>" +
      /* ADDRESS */ '<section class="pr-section" id="pr-address">' +
      sectionHead("02", "Address details") +
      '<div class="pr-grid">' +
      '<div class="pr-field pr-field--full"><label for="Address">Current address <span class="pr-req">*</span></label>' +
      '<input id="Address" name="Address" type="text" placeholder="Address line 1" required /></div>' +
      '<div class="pr-field pr-field--full"><label for="Address2">Address line 2</label>' +
      '<input id="Address2" name="Address2" type="text" placeholder="Address line 2 (optional)" /></div>' +
      '<div class="pr-field"><label for="CurrentStateID">State <span class="pr-req">*</span></label>' +
      '<select id="CurrentStateID" name="CurrentStateID" required>' +
      stateOpts +
      "</select></div>" +
      '<div class="pr-field"><label for="CurrentCityID">City <span class="pr-req">*</span></label>' +
      '<select id="CurrentCityID" name="CurrentCityID" required><option value="">Select City</option></select></div>' +
      '<div class="pr-field"><label for="CurrentPincode">Pincode <span class="pr-req">*</span></label>' +
      '<input id="CurrentPincode" name="CurrentPincode" type="text" inputmode="numeric" placeholder="6-digit pincode" maxlength="10" required /></div>' +
      '<div class="pr-field pr-field--full pr-same">' +
      '<label><input type="checkbox" name="sameAsCurrent" id="sameAsCurrent" /> Permanent address same as current</label></div>' +
      '<div class="pr-field pr-field--full"><label for="PermanentAddress">Permanent address <span class="pr-req">*</span></label>' +
      '<input id="PermanentAddress" name="PermanentAddress" type="text" placeholder="Address line 1" required /></div>' +
      '<div class="pr-field pr-field--full"><label for="PermanentAddress2">Address line 2</label>' +
      '<input id="PermanentAddress2" name="PermanentAddress2" type="text" placeholder="Address line 2 (optional)" /></div>' +
      '<div class="pr-field"><label for="PermanentStateID">State <span class="pr-req">*</span></label>' +
      '<select id="PermanentStateID" name="PermanentStateID" required>' +
      stateOpts +
      "</select></div>" +
      '<div class="pr-field"><label for="PermanentCityID">City <span class="pr-req">*</span></label>' +
      '<select id="PermanentCityID" name="PermanentCityID" required><option value="">Select City</option></select></div>' +
      '<div class="pr-field"><label for="PermanentPincode">Pincode <span class="pr-req">*</span></label>' +
      '<input id="PermanentPincode" name="PermanentPincode" type="text" inputmode="numeric" placeholder="6-digit pincode" maxlength="10" required /></div>' +
      "</div></section>" +
      /* LANGUAGES */ '<section class="pr-section" id="languages-known-section">' +
      sectionHead("03", "Languages known") +
      '<div id="pr-languages" class="pr-languages">' +
      languageRowHtml(1, true) +
      "</div></section>" +
      /* SKILLS */ '<section class="pr-section" id="skills-section">' +
      sectionHead("04", "Skills &amp; expertise") +
      '<div id="pr-skills" class="pr-skills">Loading skills…</div></section>' +
      /* EDUCATION */ '<section class="pr-section">' +
      sectionHead("05", "Education") +
      '<div class="pr-grid">' +
      '<div class="pr-field"><label for="HighestQualification">Highest qualification <span class="pr-req">*</span></label>' +
      '<select id="HighestQualification" name="HighestQualification" required>' +
      '<option value="">Choose...</option>' +
      '<option value="10th Standard">10th Standard</option>' +
      '<option value="12th Standard">12th Standard</option>' +
      '<option value="Under Graduate">Under Graduate</option>' +
      '<option value="Post Graduate">Post Graduate</option>' +
      '<option value="Doctorate">Doctorate</option></select></div>' +
      '<div class="pr-field pr-field--full"><h3 class="pr-subh">10th (SSLC)</h3></div>' +
      '<div class="pr-field"><label for="sslcInstitute">School name</label><input id="sslcInstitute" name="sslcInstitute" type="text" placeholder="Enter school name" /></div>' +
      '<div class="pr-field"><label for="sslcBoard">Board</label><input id="sslcBoard" name="sslcBoard" type="text" placeholder="Select Board" /></div>' +
      '<div class="pr-field"><label for="sslcYear">Year passed</label><select id="sslcYear" name="sslcYear">' +
      years +
      "</select></div>" +
      '<div class="pr-field"><label for="sslcPercentage">Percentage</label><input id="sslcPercentage" name="sslcPercentage" type="text" placeholder="XX.XX" /></div>' +
      '<div class="pr-field"><label for="sslcAttempts">Attempts</label><select id="sslcAttempts" name="sslcAttempts">' +
      attemptOpts +
      "</select></div>" +
      '<div class="pr-field pr-field--full"><h3 class="pr-subh">12th (HSC)</h3></div>' +
      '<div class="pr-field"><label for="hscInstitute">School name</label><input id="hscInstitute" name="hscInstitute" type="text" placeholder="Enter school name" /></div>' +
      '<div class="pr-field"><label for="hscBoard">Board</label><input id="hscBoard" name="hscBoard" type="text" /></div>' +
      '<div class="pr-field"><label for="hscYear">Year passed</label><select id="hscYear" name="hscYear">' +
      years +
      "</select></div>" +
      '<div class="pr-field"><label for="hscPercentage">Percentage</label><input id="hscPercentage" name="hscPercentage" type="text" placeholder="XX.XX" /></div>' +
      '<div class="pr-field"><label for="hscAttempts">Attempts</label><select id="hscAttempts" name="hscAttempts">' +
      attemptOpts +
      "</select></div>" +
      '<div class="pr-field pr-field--full"><h3 class="pr-subh">Under graduate</h3></div>' +
      '<div class="pr-field"><label for="ugDegree">Degree</label><input id="ugDegree" name="ugDegree" type="text" placeholder="e.g., Computer Science" /></div>' +
      '<div class="pr-field"><label for="ugSpec">Specialization</label><input id="ugSpec" name="ugSpec" type="text" /></div>' +
      '<div class="pr-field"><label for="ugType">Type</label><select id="ugType" name="ugType"><option value="">Choose...</option><option value="Full Time">Full Time</option><option value="Part Time">Part Time</option><option value="Distance">Distance</option></select></div>' +
      '<div class="pr-field"><label for="ugYearStart">Year start</label><select id="ugYearStart" name="ugYearStart">' +
      years +
      "</select></div>" +
      '<div class="pr-field"><label for="ugYearEnd">Year end</label><select id="ugYearEnd" name="ugYearEnd">' +
      years +
      "</select></div>" +
      '<div class="pr-field"><label for="ugPercentage">Percentage</label><input id="ugPercentage" name="ugPercentage" type="text" placeholder="XX.XX" /></div>' +
      '<div class="pr-field"><label for="ugArrears">Arrears</label><select id="ugArrears" name="ugArrears">' +
      arrearOpts +
      "</select></div>" +
      '<div class="pr-field pr-field--full"><h3 class="pr-subh">Post graduate (if any)</h3></div>' +
      '<div class="pr-field"><label for="pgDegree">Degree</label><input id="pgDegree" name="pgDegree" type="text" /></div>' +
      '<div class="pr-field"><label for="pgSpec">Specialization</label><input id="pgSpec" name="pgSpec" type="text" /></div>' +
      '<div class="pr-field"><label for="pgType">Type</label><select id="pgType" name="pgType"><option value="">Choose...</option><option value="Full Time">Full Time</option><option value="Part Time">Part Time</option><option value="Distance">Distance</option></select></div>' +
      '<div class="pr-field"><label for="pgYearStart">Year start</label><select id="pgYearStart" name="pgYearStart">' +
      years +
      "</select></div>" +
      '<div class="pr-field"><label for="pgYearEnd">Year end</label><select id="pgYearEnd" name="pgYearEnd">' +
      years +
      "</select></div>" +
      '<div class="pr-field"><label for="pgYearPassed">Year passed</label><select id="pgYearPassed" name="pgYearPassed">' +
      years +
      "</select></div>" +
      '<div class="pr-field"><label for="pgPercentage">Percentage</label><input id="pgPercentage" name="pgPercentage" type="text" /></div>' +
      '<div class="pr-field"><label for="pgArrears">Arrears</label><select id="pgArrears" name="pgArrears">' +
      arrearOpts +
      "</select></div>" +
      "</div></section>" +
      /* PROFESSIONAL */ '<section class="pr-section">' +
      sectionHead("06", "Professional info") +
      '<div class="pr-grid">' +
      (isIntern
        ? '<div class="pr-field"><label for="ExpectedStipend">Expected stipend (per month) <span class="pr-req">*</span></label>' +
          '<input id="ExpectedStipend" name="ExpectedStipend" type="text" inputmode="numeric" placeholder="Enter expected stipend" />' +
          '<input type="hidden" name="ExpectedSalary" value="0" /><input type="hidden" name="CurrentSalary" value="" />' +
          '<input type="hidden" name="ReasonForQuit" value="" /></div>'
        : '<div class="pr-field"><label for="ExpectedSalary">Expected CTC (per annum) <span class="pr-req">*</span></label>' +
          '<input id="ExpectedSalary" name="ExpectedSalary" type="text" inputmode="numeric" placeholder="Enter expected salary" />' +
          '<input type="hidden" name="ExpectedStipend" value="" /></div>' +
          '<div id="pr-exp-extra" class="pr-field pr-field--full pr-grid-inner" hidden>' +
          '<div class="pr-field"><label for="CurrentSalary">Current CTC (per annum) <span class="pr-req">*</span></label>' +
          '<input id="CurrentSalary" name="CurrentSalary" type="text" inputmode="numeric" placeholder="Enter current salary" /></div>' +
          '<div class="pr-field pr-field--full"><label for="ReasonForQuit">Reason for quitting previous job <span class="pr-req">*</span></label>' +
          '<textarea id="ReasonForQuit" name="ReasonForQuit" rows="3" placeholder="Reason for quitting previous job"></textarea></div></div>') +
      '<div class="pr-field"><label for="JoinPeriod">Joining period <span class="pr-req">*</span></label>' +
      '<select id="JoinPeriod" name="JoinPeriod" required><option value="">Choose...</option>' +
      '<option value="Immediate ">Immediate</option><option value="15 Days">15 Days</option>' +
      '<option value="30 Days">30 Days</option><option value="More than 30 Days">More than 30 Days</option></select></div>' +
      '<div class="pr-field"><label>Willingness to relocate <span class="pr-req">*</span></label>' +
      '<div class="pr-radios" id="relocateYes">' +
      '<label><input type="radio" name="ReadyToRelocate" value="Yes" /> Yes</label>' +
      '<label><input type="radio" name="ReadyToRelocate" value="No" /> No</label>' +
      '<label><input type="radio" name="ReadyToRelocate" value="Open" /> Open</label></div></div>' +
      '<div class="pr-field"><label for="WorkModePreference">Work mode preference <span class="pr-req">*</span></label>' +
      '<select id="WorkModePreference" name="WorkModePreference" required><option value="">Choose...</option>' +
      '<option value="Office">Office</option><option value="Hybrid">Hybrid</option><option value="Remote">Remote</option></select></div>' +
      '<div class="pr-field"><label for="InterviewMode1">Mode of interview <span class="pr-req">*</span></label>' +
      '<select id="InterviewMode1" name="InterviewMode1" required><option value="">Choose...</option>' +
      '<option value="Direct Walkin">Direct Walkin</option><option value="Virtual">Virtual</option><option value="Both">Both</option></select></div>' +
      '<div class="pr-field"><label for="ExpectedDOJ">Expected date of joining</label>' +
      '<input id="ExpectedDOJ" name="ExpectedDOJ" type="date" /></div>' +
      "</div></section>" +
      /* UPLOADS */ '<section class="pr-section" id="upload-photo-resume-section">' +
      sectionHead("07", "Uploads") +
      '<div class="pr-grid">' +
      '<div class="pr-field"><label for="ProfilePhoto">Upload your photo <span class="pr-req">*</span></label>' +
      '<input id="ProfilePhoto" name="ProfilePhoto" type="file" accept="image/*" required />' +
      '<span class="pr-hint">JPEG or PNG preferred</span></div>' +
      '<div class="pr-field"><label for="ResumeFile">Upload resume' +
      (isIntern ? "" : ' <span class="pr-req">*</span>') +
      "</label>" +
      '<input id="ResumeFile" name="ResumeFile" type="file" accept=".pdf,.doc,.docx,application/pdf"' +
      (isIntern ? "" : " required") +
      " />" +
      '<span class="pr-hint">PDF, DOC, or DOCX' +
      (isIntern ? " (optional for internships)" : "") +
      "</span></div>" +
      '<div class="pr-field pr-field--full"><label for="IntroAudio">Intro audio <span class="pr-hint-inline">(optional)</span></label>' +
      '<input id="IntroAudio" name="IntroAudio" type="file" accept="audio/*" />' +
      '<span class="pr-hint">Optional introduction recording if you wish to attach one</span></div>' +
      "</div></section>" +
      /* SUBMIT */ '<section class="pr-section pr-section--submit">' +
      '<label class="pr-declare">' +
      '<input type="checkbox" name="isDeclared" id="isDeclared" />' +
      "<span>I hereby Declare &amp; Consent <span class=\"pr-req\">*</span> that the information provided is true and I agree to be contacted about this application.</span></label>" +
      '<div class="pr-actions">' +
      '<button type="submit" class="pr-btn pr-btn-ink" id="pr-submit">Submit Application</button>' +
      '<a class="pr-btn pr-btn-panel" href="Careerdetails.html?id=' +
      escapeHtml(String(job.jobid)) +
      '">Back to role</a>' +
      "</div>" +
      "</section></form>"
    );
  }

  async function resolveJob(jobId) {
    if (!jobId) return null;
    try {
      var path = "/api/careers/" + encodeURIComponent(jobId);
      var url = typeof window.NH_apiUrl === "function" ? window.NH_apiUrl(path) : path;
      var res = await fetch(url, {
        credentials: "omit",
        cache: "no-store",
      });
      if (res.ok) {
        var data = await res.json();
        if (data && data.career && data.career.detail) return data.career.detail;
        if (data && data.career) {
          return {
            jobid: data.career.job_code,
            post: data.career.title,
            experience: data.career.experience,
            location: data.career.location,
            responsibilities: data.career.responsibilities,
            musthave: data.career.requirements,
            applyUrl: data.career.apply_url,
            expireDate: data.career.expire_date,
            validationType: data.career.validation_type,
          };
        }
      }
    } catch (_err) {
      /* offline fallback */
    }
    var catalog = window.NOHITATU_CAREER_DETAILS || {};
    return catalog[jobId] || null;
  }

  async function mount() {
    var id = getId();
    var job = await resolveJob(id);

    if (!job) {
      renderNotFound(id);
      return;
    }

    var isIntern = String(job.validationType || "").toUpperCase() === "I";
    var title = qs("#pr-title");
    var meta = qs("#pr-meta");
    var main = qs("#pr-main");
    var post = job.post || "Open role";

    document.title = "Apply — " + post + " | Nohitatu";
    var desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Apply for " + post + " (job code " + job.jobid + ") at Nohitatu."
      );
    }

    if (title) title.textContent = "Apply: " + post;
    if (meta) {
      meta.hidden = false;
      meta.innerHTML =
        '<li><span class="pr-meta-label">Job code</span><span class="pr-meta-value pr-code">' +
        escapeHtml(String(job.jobid)) +
        "</span></li>" +
        '<li><span class="pr-meta-label">Experience</span><span class="pr-meta-value">' +
        escapeHtml(job.experience || "—") +
        "</span></li>" +
        '<li><span class="pr-meta-label">Location</span><span class="pr-meta-value">' +
        escapeHtml(job.location || "—") +
        "</span></li>";
    }

    if (!main) return;
    main.innerHTML = buildFormMarkup(job, isIntern);

    var form = qs("#pr-form");
    revealForm(form);
    wireSameAsCurrent(form);
    wireLanguageSection(qs("#pr-languages"));

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

    await loadRatings();
    var skillsEl = qs("#pr-skills");
    await loadSkills(job.jobid, skillsEl, isIntern);

    form.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      var skillPack = collectSkills(qs("#pr-skills"), isIntern);
      var languages = collectLanguages(qs("#pr-languages"));
      if (!validate(form, isIntern, skillPack, languages)) return;

      var fd = buildFormData(form, job.jobid, isIntern, skillPack.list, languages);
      var btn = qs("#pr-submit");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Submitting…";
      }
      setStatus("Sending application…", "info");

      try {
        var res = await fetch(RESUME_POST, {
          method: "POST",
          body: fd
        });
        var text = await res.text();
        var data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = null;
        }

        if (res.ok && Array.isArray(data) && data[0]) {
          var result = handleApiSuccess(data[0]);
          if (result === "ok") {
            form.reset();
            // restore first language row + skills
            var langBox = qs("#pr-languages");
            if (langBox) {
              langUid = 1;
              langBox.innerHTML = languageRowHtml(1, true);
            }
            if (skillsEl) await loadSkills(job.jobid, skillsEl, isIntern);
          }
        } else if (res.ok) {
          setStatus(
            "Application sent. You may receive a confirmation by email.",
            "ok"
          );
        } else {
          setStatus(
            "Something went wrong, try again. (HTTP " +
              res.status +
              "). Or email hrd@nohitatu.com with job code " +
              job.jobid +
              ".",
            "error"
          );
        }
      } catch (err) {
        console.error(err);
        setStatus(
          "Something went wrong, try again. Network error posting application. Email hrd@nohitatu.com with job code " +
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
