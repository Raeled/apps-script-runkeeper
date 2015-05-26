function Context(clientID, clientSecret) {
  this.service = OAuth2.createService("runkeeper")
    .setAuthorizationBaseUrl('https://runkeeper.com/apps/authorize')
    .setTokenUrl('https://runkeeper.com/apps/token')
    .setClientId(clientID)
    .setClientSecret(clientSecret)
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties());
  
  this.urlBase = 'https://api.runkeeper.com';
}

Context.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
Context.dayOfWeeks = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

Context.prototype.connect = function() {
  if (!this.service.hasAccess()) {
    return false;
  } else {
    
    var userResponse = UrlFetchApp.fetch(this.urlBase + '/user', {
      headers: {
        Authorization: 'Bearer ' + this.service.getAccessToken(),
        Accept: 'application/vnd.com.runkeeper.User+json'
      }
    });
    
    this.userData = JSON.parse(userResponse.getContentText());
    
    return true;
  }
}

Context.prototype.getWeightFeed = function() {
  return {
    context: this,
    current: null,
    currentPage: { items: [], next: this.userData.weight },
    currentPageIndex: -1,
    moveNext: function() {
      
      this.currentPageIndex++;
    
      if (this.currentPageIndex >= this.currentPage.items.length) {
        if (this.currentPage.next) {
          
          var weightUrl = this.currentPage.next;
          var weightSetFeedData = {
            headers: {
              Authorization: 'Bearer ' + this.context.service.getAccessToken(),
              Accept: 'application/vnd.com.runkeeper.WeightSetFeed+json'
            }
          };
          var weightResponse = UrlFetchApp.fetch(this.context.urlBase + weightUrl, weightSetFeedData);
          
          this.currentPage = JSON.parse(weightResponse.getContentText());
          this.currentPageIndex = -1;
          
          return this.moveNext();
        }
        
        this.current = null;
        return false;
      }
    
      this.current = this.currentPage.items[this.currentPageIndex];
      this.current.timestamp = new Date(this.current.timestamp)
      return true;
    }
  };
}

Context.prototype.setWeight = function(timestamp, weight, fat_percent) {
  var formattedTimestamp = Context.dayOfWeeks[timestamp.getDay()] + ", " + timestamp.getDate() + " " + Context.monthNames[timestamp.getMonth()] + " " + timestamp.getFullYear() + " 00:00:00";
  
  var payloadList = [];
  
  if (weight) {
    payloadList.push(JSON.stringify({"timestamp": formattedTimestamp, "weight": weight}));
  }
  
  if (fat_percent) {
    payloadList.push(JSON.stringify({"timestamp": formattedTimestamp, "fat_percent": fat_percent}));
  }
  
  for (var i = 0; i < payloadList.length; i++) {
    // Using old API for now as new API seems to get the timestamp off by a day.
    var setResponse = UrlFetchApp.fetch(this.urlBase + this.userData.weight, {
      method: 'post',
      payload: payloadList[i],
      contentType: 'application/vnd.com.runkeeper.NewWeight+json',
      headers: {
        Authorization: 'Bearer ' + this.service.getAccessToken(),
        Accept: 'application/vnd.com.runkeeper.WeightSet+json'
      }
    });
    
    if (setResponse.getResponseCode() < 200 || setResponse.getResponseCode() > 299) {
      return false;
    }
  }
  
  return payloadList.length > 0;
}

function authCallback(request) {
  var driveService = getDriveService();
  var isAuthorized = driveService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
}