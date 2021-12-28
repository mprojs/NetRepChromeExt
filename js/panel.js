var lineIndex = 0;

function toggle(e) {
  if ($(e.currentTarget).hasClass('copyReport')) {
    return;
  }
  var li = $(e.currentTarget).closest('li');
  if (li.find('span:first').hasClass('collapsed')) {
    li.find('span:first').removeClass('collapsed').addClass('expanded');
    li.find('.json_content').removeClass('hide');
  } else if (li.find('span:first').hasClass('expanded')) {
    li.find('span:first').removeClass('expanded').addClass('collapsed');
    li.find('.json_content').addClass('hide');
  } else {
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
}

function clearView(e) {
  $('#loglist').empty();
}

function expandAll(e) {
  $('.json_content').removeClass('hide');
  $('.json_content').prev().find('span:first').removeClass('collapsed').addClass('expanded');
}

function collapseAll(e) {
  $('.json_content').addClass('hide');
  $('.json_content').prev().find('span:first').removeClass('expanded').addClass('collapsed');
}

function extractParameters(jsonArray) {
  var params = {};
  for (var i = 0, length = jsonArray.length; i < length; i++) {
    params[jsonArray[i].name] = jsonArray[i].value;
  }
  return params;
}

function isExcluded(netevent) {
  var domains = $('#exclude').val().split(';');
  var length = domains.length;

  for (var i = 0; i < length; i++) {
    if (domains[i]) {
      if (netevent.request.url.match(domains[i].trim())) {
        return true;
      }
    }
  }
  return false;
}

function copyToClipboard(text) {
  var tempText = document.createElement("textarea");
  tempText.value = text;
  document.body.appendChild(tempText);
  tempText.select();

  document.execCommand("copy");
  document.body.removeChild(tempText);

}

function setCurrentOrigin(currentURL) {
  console.log(currentURL);
  if (!currentURL) {
    return;
  }
  const domainIndex = currentURL.indexOf(':') + 3;
  const partFromDomain = currentURL.substr(domainIndex);
  if (partFromDomain.length > 1) {
    const subParts = partFromDomain.split('/');
    currentOriginWoProto = subParts[0];
  }
}

function getCLeanRequestUrl(url, curOrigin) {
  const startIndex = url.indexOf(curOrigin);
  console.log(url, curOrigin);
  if (startIndex > -1) {
    return url.substr(startIndex).replace(curOrigin, '');
  } else {
    return url;
  }
}

let currentOriginWoProto;
console.log(chrome.tabs);
console.log(chrome.devtools);
console.log(chrome.tabs.get(chrome.devtools.inspectedWindow.tabId, function (data) {
  setCurrentOrigin(data.url);
}));

$('#loglist').off().on('click', 'span.url', toggle);
$('#loglist').on('click', 'span.icon', toggle);
$('#clear').off().on('click', clearView);
$('#expandall').off().on('click', expandAll);
$('#collapseall').off().on('click', collapseAll);
chrome.devtools.network.onRequestFinished.addListener(function (netevent) {
  var line;
  var isErrorStatus = (netevent.response.status >= 400 && netevent.response.status < 600);
  if (!isExcluded(netevent)) {
    if (netevent.response.content.mimeType.indexOf('application/json') > -1 || isErrorStatus) {
      lineIndex++;

      const cleanUrl = getCLeanRequestUrl(netevent.request.url, currentOriginWoProto);

      var cssStatusClass = isErrorStatus ? 'red' : '';
      line = '<li id="k' + lineIndex + '" class="' + cssStatusClass + '">';
      line += '	<div class="line">';
      line += '		<span class="icon collapsed"></span><span class="url ' + cssStatusClass + '">' + netevent.request.method + '  ' + cleanUrl + '</span> <span class="status ' + cssStatusClass + '">' + netevent.response.status + ' ' + netevent.response.statusText + '</span>';
      line += '	</div>';
      line += '	<div class="json_content hide">';
      line += '	  <div><button class="copyReport">Copy report</button></div>';
      line += '	  <div class="reportPreview"></div>';
      line += '		<div class="report"></div>';
      line += '		<div class="response"></div>';
      // line += '		<div class="request"> GET Parameters: <p class="get_parameters"></p> </div>';
      line += '		<div class="clear"></div>';
      line += '	</div>';
      line += '</li>';
      $('#loglist').append(line);
      var request = netevent.request;
      var response = netevent.response;

      var report = {
        url: cleanUrl,
        method: request.method,
      };

      if (response) {
        var headers = response.headers;
        var dateHeader = headers.find(item => item.name.toLowerCase() === 'date');
        if (dateHeader) {
          report.date = dateHeader.value;
        }
      }

      console.log(netevent);
      var queryString = request.queryString;
      report.queryParams = extractParameters(queryString);

      if (netevent.request.postData && netevent.request.postData.mimeType.indexOf('application/json') > -1) {
        var postContent = JSON.parse(netevent.request.postData.text);
        report.payload = postContent;
        // $('#k'+lineIndex).find('.request').append('<div>POST Payload:</div><div class="request_payload"></div>');
        // $('#k'+lineIndex).find('.request_payload').JSONView(postContent);
      }
      netevent.getContent($.proxy(function (body, encoding) {
        var parsed = JSON.parse(body);
        report.responseBody = parsed;
        $('#k' + this.lineIndex).find('.response').JSONView(parsed);
      }, {lineIndex: lineIndex}));

      $('#k' + lineIndex).find('.report').JSONView(report);

      // var list = $('body');
      // list.animate({scrollTop : list.prop('scrollHeight')}, '500');
      var printReport = function () {
        try {
          console.log(report);
        } catch (e) {
        }
        $('#k' + this.lineIndex).find('.reportPreview').JSONView(report);

        copyToClipboard(JSON.stringify(report, null, 2));
      }
      $('#k' + lineIndex).find('.copyReport').click(printReport);
    }
  }
});
chrome.devtools.network.onNavigated.addListener(function (url) {
  if (!$('#preserve_log').is(':checked')) {
    clearView();
  }
});

