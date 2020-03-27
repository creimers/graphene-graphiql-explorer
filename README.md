# graphene graphiql explorer

😎This django app adds the [ graphiql explorer ](https://github.com/OneGraph/graphiql-explorer) the graphene's graphiql view.

## installation

`pip install https://github.com/creimers/graphene-graphiql-explorer/archive/master.zip`

Yes, I will eventually publish this on pypi.

## setup

Add `graphene_graphiql_explorer` to your `INSTALLED_APPS`.

Override the default graphene graphiql template in your `urls.py`:

```python
from graphene_django.views import GraphQLView

GraphQLView.graphiql_template = "graphene_graphiql_explorer/graphiql.html"

urlpatterns = [
    ...
    url(
        r"^graphql/$",
        GraphQLView.as_view(graphiql=True),
        name="graphql",
    ),
    ...
]
```

Collect those static files.
