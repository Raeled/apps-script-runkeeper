# RunKeeper for Google Apps Script

## Usage

### 1. Create the RunKeeper context

Before usage you are required to create your own application using the 
[RunKeeper partner portal](http://runkeeper.com/partner/applications)

    var context = new RunKeeper.Context('clientID', 'clientSecret');
	
	if (context.connect()) {
	  // Use context.
	}
	
### 2. Get weight data

    var weightData = context.getWeightFeed();
	while (weightData.moveNext()) {
	  var date = weightData.current.timestamp;
	  var weight = weightData.current.weight;
	  var fat_percent = weightData.current.fat_percent;
	}
	
### 3. Add weight data

	// Add weight
    context.setWeight(new Date(1984, 7, 30), 75.4);
	
	// Add weight and fat percent
	context.setWeight(new Date(1984, 7, 30), 75.4, 16.2);