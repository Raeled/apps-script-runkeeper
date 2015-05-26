function Enumerator(context, url, acceptContentType, modifier) {
  this.context = context;
  this.current = null;
  this.currentPage = { items: [], next: url };
  this.currentPageIndex = -1;
  this.acceptContentType = acceptContentType;
  this.modifier = modifier;
}

Enumerator.prototype.moveNext = function() {
  this.currentPageIndex++;
    
  if (this.currentPageIndex >= this.currentPage.items.length) {
    if (this.currentPage.next) {
          
      var weightUrl = this.currentPage.next;
      var weightSetFeedData = {
        headers: {
          Authorization: 'Bearer ' + this.context.service.getAccessToken(),
          Accept: this.acceptContentType
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
  
  if (this.modifier)
    this.current = this.modifier(this.current);
  
  return true;
}