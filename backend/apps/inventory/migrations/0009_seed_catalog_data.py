from django.db import migrations

def seed_data(apps, schema_editor):
    pass

def reverse_seed(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('inventory', '0008_add_productimage'),
    ]

    operations = [
        migrations.RunPython(seed_data, reverse_seed),
    ]
