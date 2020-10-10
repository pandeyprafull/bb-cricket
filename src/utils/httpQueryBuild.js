
  const http_query_build = (searchParametersData) =>{
    var searchParameters = new URLSearchParams();

    Object.keys(searchParametersData).forEach(function(parameterName) {
      searchParameters.append(parameterName, searchParametersData[parameterName]);
    });

    return searchParameters.toString();
  }

  module.exports = http_query_build