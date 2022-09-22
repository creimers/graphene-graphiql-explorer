# graphene graphiql explorer

[![PyPI](https://img.shields.io/pypi/v/graphene_graphiql_explorer)](https://pypi.org/project/graphene-graphiql-explorer/)

😎 This django app adds the [ graphiql explorer ](https://github.com/OneGraph/graphiql-explorer) to graphene's graphiql view.

The graphiql version used is 1.9.10.

## Installation

`pip install graphene_graphiql_explorer`

## Setup

Add `graphene_graphiql_explorer` to your `INSTALLED_APPS`.

Override the default graphene graphiql template in your `urls.py`:

```python
from graphene_django.views import GraphQLView

GraphQLView.graphiql_template = "graphene_graphiql_explorer/graphiql.html"

urlpatterns = [
    # ...
    url(
        r"^graphql/$",
        GraphQLView.as_view(graphiql=True),
        name="graphql",
    ),
    # ...
]
```

**Don't forget to collect those static files.**

Brought to you by [superservice international](https://superservice-international.com).

## Development

### Release

`python -m build`

`python -m twine upload -r testpypi dist/*`

`python -m twine check dist/*`